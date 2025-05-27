#!/usr/bin/env node

/**
 * Test script to verify all motion detection servers are running correctly
 */

import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const FLASK_API_URL = 'http://localhost:5110';
const SOCKETIO_URL = 'http://localhost:3000';

async function testFlaskAPI() {
  console.log('🧪 Testing Flask API...');

  try {
    const response = await fetch(`${FLASK_API_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Flask API is running:', data);
      return true;
    } else {
      console.log('❌ Flask API returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Flask API is not running:', error.message);
    return false;
  }
}

async function testSocketIOBridge() {
  console.log('🧪 Testing Socket.IO Bridge...');

  try {
    const response = await fetch(`${SOCKETIO_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Socket.IO Bridge is running:', data);
      return true;
    } else {
      console.log('❌ Socket.IO Bridge returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Socket.IO Bridge is not running:', error.message);
    return false;
  }
}

function testSocketIOConnection() {
  return new Promise((resolve) => {
    console.log('🧪 Testing Socket.IO Connection...');

    const socket = io(SOCKETIO_URL);
    let connected = false;

    socket.on('connect', () => {
      console.log('✅ Socket.IO connection established');
      connected = true;
      socket.disconnect();
      resolve(true);
    });

    socket.on('connected', (data) => {
      console.log('✅ Socket.IO server responded with:', data);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Socket.IO connection failed:', error.message);
      if (!connected) {
        resolve(false);
      }
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!connected) {
        console.log('❌ Socket.IO connection timeout');
        socket.disconnect();
        resolve(false);
      }
    }, 5000);
  });
}

async function runTests() {
  console.log('🚀 Starting Motion Detection Server Tests\n');

  const flaskOK = await testFlaskAPI();
  console.log('');

  const socketBridgeOK = await testSocketIOBridge();
  console.log('');

  const socketConnectionOK = await testSocketIOConnection();
  console.log('');

  console.log('📊 Test Results:');
  console.log(`Flask API: ${flaskOK ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Socket.IO Bridge: ${socketBridgeOK ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Socket.IO Connection: ${socketConnectionOK ? '✅ PASS' : '❌ FAIL'}`);

  if (flaskOK && socketBridgeOK && socketConnectionOK) {
    console.log('\n🎉 All servers are running correctly!');
    console.log('You can now test the motion detection in your React app.');
  } else {
    console.log('\n⚠️  Some servers are not running properly.');
    console.log('\nTroubleshooting:');

    if (!flaskOK) {
      console.log('- Start Flask API: npm run flask-api');
      console.log('- Or manually: cd motionDetection && venv\\Scripts\\activate && python pose_api.py');
    }

    if (!socketBridgeOK) {
      console.log('- Start Socket.IO Bridge: npm run pose-server');
      console.log('- Or manually: node pose-detection-server.js');
    }

    if (!socketConnectionOK) {
      console.log('- Check if Socket.IO Bridge is running on port 3000');
      console.log('- Check for port conflicts');
    }
  }

  process.exit(flaskOK && socketBridgeOK && socketConnectionOK ? 0 : 1);
}

runTests().catch(console.error);
