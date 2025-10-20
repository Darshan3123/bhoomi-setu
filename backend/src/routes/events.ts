import express from 'express';
import { eventListenerService } from '../services/eventListener';

const router = express.Router();

/**
 * Get event listener status
 */
router.get('/status', (req, res) => {
  try {
    const isRunning = eventListenerService.isEventListenerRunning();
    
    res.json({
      success: true,
      data: {
        isListening: isRunning,
        status: isRunning ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    console.error('Error getting event listener status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event listener status'
    });
  }
});

/**
 * Start event listener
 */
router.post('/start', async (req, res) => {
  try {
    await eventListenerService.startListening();
    
    res.json({
      success: true,
      message: 'Event listener started successfully'
    });
  } catch (error) {
    console.error('Error starting event listener:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start event listener'
    });
  }
});

/**
 * Stop event listener
 */
router.post('/stop', (req, res) => {
  try {
    eventListenerService.stopListening();
    
    res.json({
      success: true,
      message: 'Event listener stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping event listener:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop event listener'
    });
  }
});

/**
 * Get past events
 */
router.get('/history', async (req, res) => {
  try {
    const { fromBlock = 0, toBlock = 'latest' } = req.query;
    
    const events = await eventListenerService.getPastEvents(
      Number(fromBlock),
      toBlock as string
    );
    
    // Format events for response
    const formattedEvents = events.map(event => ({
      eventName: event.eventName || event.fragment?.name,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      args: event.args,
      address: event.address,
      timestamp: new Date().toISOString() // You might want to get actual block timestamp
    }));
    
    res.json({
      success: true,
      data: {
        events: formattedEvents,
        count: formattedEvents.length,
        fromBlock: Number(fromBlock),
        toBlock
      }
    });
  } catch (error) {
    console.error('Error getting event history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event history'
    });
  }
});

/**
 * Test contract interaction (trigger events)
 */
router.post('/test', async (req, res) => {
  try {
    const { action = 'register' } = req.body;
    
    // This is a test endpoint - in production you'd have proper authentication
    // and use the actual user's wallet
    
    res.json({
      success: true,
      message: `Test ${action} action would be performed here`,
      note: 'This is a test endpoint. Use your frontend to trigger actual contract interactions.'
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed'
    });
  }
});

export default router;