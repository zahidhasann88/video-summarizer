import fs from 'fs';
import path from 'path';

function checkEnvironmentSetup() {
  console.log('🔍 Checking environment setup...\n');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found in project root');
    console.log('📝 Creating example .env file...');
    
    const exampleEnv = `# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=5000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800  # 50MB in bytes
`;
    
    fs.writeFileSync(envPath, exampleEnv);
    console.log('✅ Created example .env file');
    console.log('⚠️ Please edit .env and add your OpenAI API key');
    process.exit(1);
  }

  // Check if uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('📁 Creating uploads directory...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
  }

  console.log('✅ Environment setup looks good!\n');
}

checkEnvironmentSetup();