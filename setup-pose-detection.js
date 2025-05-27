#!/usr/bin/env node

/**
 * Setup script for Pose Detection System
 * This script helps users set up and test the pose detection system
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🤸‍♂️ Setting up Pose Detection System...\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the ad-dictator-showcase-demo directory.');
  process.exit(1);
}

// Check if Python API directory exists
const pythonApiPath = path.join(process.cwd(), 'motionDetection');
if (!fs.existsSync(pythonApiPath)) {
  console.error('❌ Error: motionDetection directory not found. Please ensure the Python API is in the correct location.');
  process.exit(1);
}

async function runCommand(command, description, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📦 ${description}...`);
    
    const child = spawn(command, { 
      shell: true, 
      stdio: 'inherit',
      cwd: options.cwd || process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully\n`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code ${code}\n`);
        reject(new Error(`Command failed: ${command}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Error running ${description}:`, error.message);
      reject(error);
    });
  });
}

async function checkPythonDependencies() {
  return new Promise((resolve) => {
    console.log('🐍 Checking Python dependencies...');
    
    exec('python --version', (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️  Python not found. Please install Python 3.8+ to use the pose detection API.');
        resolve(false);
        return;
      }
      
      console.log(`✅ Found Python: ${stdout.trim()}`);
      
      // Check if pip is available
      exec('pip --version', (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️  pip not found. Please install pip to manage Python dependencies.');
          resolve(false);
          return;
        }
        
        console.log(`✅ Found pip: ${stdout.trim()}\n`);
        resolve(true);
      });
    });
  });
}

async function installPythonDependencies() {
  const requirementsPath = path.join(pythonApiPath, 'requirements.txt');
  if (fs.existsSync(requirementsPath)) {
    await runCommand(
      'pip install -r requirements.txt',
      'Installing Python dependencies',
      { cwd: pythonApiPath }
    );
  } else {
    console.log('⚠️  requirements.txt not found. Skipping Python dependency installation.');
  }
}

async function main() {
  try {
    // Step 1: Install Node.js dependencies
    await runCommand('npm install', 'Installing Node.js dependencies');
    
    // Step 2: Check Python setup
    const pythonAvailable = await checkPythonDependencies();
    
    if (pythonAvailable) {
      // Step 3: Install Python dependencies
      await installPythonDependencies();
    }
    
    // Step 4: Create startup instructions
    console.log('🎉 Setup completed successfully!\n');
    console.log('📋 To start the pose detection system:\n');
    
    if (pythonAvailable) {
      console.log('1️⃣  Start the Python pose detection API:');
      console.log('   cd motionDetection');
      console.log('   python pose_api.py\n');
      
      console.log('2️⃣  Start the Node.js pose detection server (in a new terminal):');
      console.log('   npm run pose-server\n');
      
      console.log('3️⃣  Start the React development server (in a new terminal):');
      console.log('   npm run dev\n');
      
      console.log('🌐 Access points:');
      console.log('   • Standalone demo: http://localhost:3000');
      console.log('   • React app: http://localhost:8080');
      console.log('   • Python API: http://localhost:5110\n');
    } else {
      console.log('⚠️  Python setup incomplete. You can still run the React app:');
      console.log('   npm run dev\n');
      console.log('   But pose detection will not work without the Python API.');
    }
    
    console.log('📖 For detailed instructions, see POSE_DETECTION_README.md');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Manual setup instructions:');
    console.log('1. npm install');
    console.log('2. cd motionDetection && pip install -r requirements.txt');
    console.log('3. python pose_api.py (in motionDetection directory)');
    console.log('4. npm run pose-server (in main directory)');
    console.log('5. npm run dev (in main directory)');
    process.exit(1);
  }
}

// Run the setup
main();
