process.env.FACEBOOK_APP_SECRET = 'test-secret'
process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN = 'test-verify-token'
process.env.GEMINI_API_KEY = 'test-gemini-key'

import { automationService } from '@/lib/services/automation.service'
import { POST as webhookPost } from '@/app/api/auth/facebook/webhook/route'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    connectedAccount: { findFirst: jest.fn() },
    automationEvent: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    automationSettings: { findUnique: jest.fn() }
  }
}))

// Mock Gemini AI API
const mockGenerateContent = jest.fn()
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockImplementation(() => {
          return {
            generateContent: mockGenerateContent
          }
        })
      }
    })
  }
})

describe('Instagram DM Auto-Reply Automation Flow', () => {
  const mockFetch = global.fetch as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'Thank you for your message! This is a test AI reply. 🤖'
      }
    })
    // Mock global fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message_id: 'sent-msg-123' })
    })
  })

  function makeSignedWebhookRequest256(body: object): Request {
    const bodyText = JSON.stringify(body)
    const sig = 'sha256=' + crypto.createHmac('sha256', 'test-secret').update(Buffer.from(bodyText)).digest('hex')
    return new Request('http://localhost/api/auth/facebook/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': sig,
      },
      body: bodyText,
    })
  }

  it('Step-by-step verification of DM Fetch, AI generation, Queueing, and Sending', async () => {
    console.log('\n=== STARTING STEP-BY-STEP DM AUTOMATION FLOW TEST ===')

    // -------------------------------------------------------------
    // Step 1: Mock Database Account & Automation Settings setup
    // -------------------------------------------------------------
    console.log('Step 1: Setting up mock account and AI settings in database...')
    const mockAccount = {
      id: 'acc-123',
      userId: 'user-456',
      username: 'insta_test_business',
      instagramBusinessId: 'ig-biz-789',
      pageAccessToken: 'token-xyz',
      automationSettings: {
        id: 'settings-123',
        userId: 'user-456',
        accountId: 'acc-123',
        autoDmReply: true,
        dmDelayMin: 0, // Delay 0 for instantaneous testing
        dmDelayMax: 0,
        dmMode: 'AI',
        dmTemplate: 'Thanks for writing!',
        dmAiPersonality: 'Warm, friendly and professional'
      }
    }

    ;(prisma.connectedAccount.findFirst as jest.Mock).mockResolvedValue(mockAccount)
    ;(prisma.automationEvent.findFirst as jest.Mock).mockResolvedValue(null) // No existing message duplicate

    // -------------------------------------------------------------
    // Step 2: Simulate Webhook receiving DM event from Meta
    // -------------------------------------------------------------
    console.log('Step 2: Simulating Meta webhook event delivery for incoming direct message...')
    const webhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'ig-biz-789',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'sender-customer-999' },
              recipient: { id: 'ig-biz-789' },
              timestamp: Date.now(),
              message: {
                mid: 'msg-incoming-unique-111',
                text: 'Hello, do you have store hours today?'
              }
            }
          ]
        }
      ]
    }

    const request = makeSignedWebhookRequest256(webhookPayload)
    const response = await webhookPost(request)
    expect(response.status).toBe(200)
    const resData = await response.json()
    expect(resData.success).toBe(true)
    console.log('✔ Webhook processed successfully, event parsed.')

    // Verify automationService.handleDmEvent was called and queried correct tables
    expect(prisma.connectedAccount.findFirst).toHaveBeenCalledWith({
      where: { instagramBusinessId: 'ig-biz-789' },
      include: { automationSettings: true }
    })

    // Verify duplicate checks performed
    expect(prisma.automationEvent.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: 'acc-123',
        payload: {
          contains: '"igMessageId":"msg-incoming-unique-111"'
        }
      }
    })

    // Verify AI generation was triggered
    expect(mockGenerateContent).toHaveBeenCalled()
    const genAiPrompt = mockGenerateContent.mock.calls[0][0]
    console.log('Step 2b: AI response generated with Prompt Context:')
    console.log(`Prompt text: ${genAiPrompt}`)
    expect(genAiPrompt).toContain('do you have store hours today?')
    expect(genAiPrompt).toContain('Warm, friendly and professional')

    // Verify that the event was correctly saved in DB as PENDING with parsed fields
    expect(prisma.automationEvent.create).toHaveBeenCalled()
    const createData = (prisma.automationEvent.create as jest.Mock).mock.calls[0][0].data
    console.log('Step 3: Verifying correct queueing and serialization to db payload...')
    expect(createData.userId).toBe('user-456')
    expect(createData.accountId).toBe('acc-123')
    expect(createData.eventType).toBe('DM_REPLY')
    expect(createData.status).toBe('PENDING')
    expect(createData.igUserId).toBe('sender-customer-999')

    const parsedPayload = JSON.parse(createData.payload)
    expect(parsedPayload.igMessageId).toBe('msg-incoming-unique-111')
    expect(parsedPayload.incomingText).toBe('Hello, do you have store hours today?')
    expect(parsedPayload.outgoingText).toBe('Thank you for your message! This is a test AI reply. 🤖')
    console.log(`✔ Correctly queued pending event. Outgoing Reply Text: "${parsedPayload.outgoingText}"`)

    // -------------------------------------------------------------
    // Step 4: Execute scheduled DM reply processing
    // -------------------------------------------------------------
    console.log('Step 4: Executing pending events due queue processor...')
    
    // Setup event for processDueEvents
    const mockPendingEvent = {
      id: 'event-active-999',
      userId: 'user-456',
      accountId: 'acc-123',
      igUserId: 'sender-customer-999',
      eventType: 'DM_REPLY',
      payload: createData.payload,
      status: 'PENDING',
      scheduledFor: new Date(),
      connectedAccount: mockAccount
    }

    ;(prisma.automationEvent.findMany as jest.Mock).mockResolvedValue([mockPendingEvent])
    ;(prisma.automationEvent.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
    ;(prisma.automationSettings.findUnique as jest.Mock).mockResolvedValue(mockAccount.automationSettings)

    // Execute processing
    const processResult = await automationService.processDueEvents()
    expect(processResult.dmReplies).toBe(1)
    expect(processResult.failed).toBe(0)

    // Verify POST request sent to Facebook / Instagram messages API
    expect(global.fetch).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/ig-biz-789/messages',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: 'sender-customer-999' },
          message: { text: 'Thank you for your message! This is a test AI reply. 🤖' },
          access_token: 'token-xyz'
        })
      })
    )
    console.log('✔ POST request dispatched to Facebook Graph API for delivery.')

    // Verify DB update status from PENDING -> PROCESSING -> DONE
    expect(prisma.automationEvent.updateMany).toHaveBeenCalledWith({
      where: { id: 'event-active-999', status: 'PENDING' },
      data: { status: 'PROCESSING' }
    })
    expect(prisma.automationEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-active-999' },
      data: expect.objectContaining({
        status: 'DONE'
      })
    })
    console.log('✔ AutomationEvent status updated to DONE.')
    console.log('=== STEP-BY-STEP DM AUTOMATION FLOW TEST PASSED ===\n')
  })
})
