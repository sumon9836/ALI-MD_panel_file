/*═══════════════════════════════════════*/
//           𝐀ɭīī 𝐌𝐃 𝐁❍𝐓 𝐩𝐚𝐧𝐞𝐥 𝐟𝐢𝐥𝐞         //
// 𝐂𝐫𝐞𝐚𝐭𝐞 𝐛𝐲 𝘴น𝚖𝔞ꪦ_𝗿ǿⲩ 🍉 𝐀ɭīī 𝐈𝐍𝅦𝐗īī𝐃𝐄^᪲᪲᪲ «³策⁩ //

/*═══════════════════════════════════════*/
//             𝐃𝐨𝐧'𝐭 𝐄𝐝𝐢𝐭 𝐂𝐨𝐝𝐞.            //        
/*═══════════════════════════════════════*/

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const os = require('os');

const REPO_URL = "https://github.com/ALI-INXIDE/ALI-MD.git";
const CLONE_DIR = "ALI-MD";
const CONFIG_PATH = path.join(CLONE_DIR, 'config.js');

const log = {
  info: (msg) => console.log(`\x1b[36m🌐 ${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
  progress: (msg) => console.log(`\x1b[35m🔍 ${msg}\x1b[0m`)
};

async function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(`\x1b[33m${question}\x1b[0m`, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function checkPrerequisites() {
  const requirements = ['git', 'node', 'npm'];
  const missing = [];
  for (const req of requirements) {
    try {
      execSync(`${req} --version`, { stdio: 'ignore' });
    } catch {
      missing.push(req);
    }
  }
  if (missing.length > 0) {
    log.error(`Missing required tools: ${missing.join(', ')}`);
    log.info('Please install the missing tools and try again.');
    process.exit(1);
  }
}

function getPackageManager() {
  try {
    execSync('yarn --version', { stdio: 'ignore' });
    return 'yarn';
  } catch {
    log.warning('Yarn not found, using npm instead');
    return 'npm';
  }
}

function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const { cwd, silent = false } = options;
    if (!silent) log.progress(`Executing: ${command}`);
    try {
      const result = execSync(command, {
        cwd,
        stdio: silent ? 'pipe' : 'inherit',
        encoding: 'utf8'
      });
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

async function cloneRepository() {
  if (fs.existsSync(CLONE_DIR)) {
    log.info("Repository already exists, checking for updates...");
    try {
      await executeCommand('git pull origin main', { cwd: CLONE_DIR });
      log.success("Repository updated successfully");
    } catch {
      log.warning("Could not update repository, continuing with existing version");
    }
    return;
  }
  try {
    log.info("Cloning 𝐀ɭīī repository...");
    await executeCommand(`git clone ${REPO_URL} ${CLONE_DIR}`);
    log.success("Repository cloned successfully");
  } catch (error) {
    log.error(`Failed to clone repository: ${error.message}`);
    throw error;
  }
}

async function updateConfigJs(sessionId) {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      throw new Error(`Config file not found at ${CONFIG_PATH}`);
    }
    let configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const backupPath = CONFIG_PATH + '.backup';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, configData);
      log.info("Config backup created");
    }
    const sessionIdPattern = /SESSION_ID:\s*(?:process\.env\.SESSION_ID\s*\|\|\s*)?['"`][^'"`]*['"`]/;
    if (sessionIdPattern.test(configData)) {
      configData = configData.replace(sessionIdPattern, `SESSION_ID: '${sessionId}'`);
    } else {
      const envPattern = /module\.exports\s*=\s*{/;
      if (envPattern.test(configData)) {
        configData = configData.replace(envPattern, `module.exports = {\n  SESSION_ID: '${sessionId}',`);
      } else {
        throw new Error("Could not locate where to insert SESSION_ID in config file");
      }
    }
    fs.writeFileSync(CONFIG_PATH, configData, 'utf-8');
    log.success("SESSION_ID saved successfully");
  } catch (error) {
    log.error(`Failed to update config: ${error.message}`);
    throw error;
  }
}

async function setupSessionId() {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
    if (configData.includes("SESSION_ID: '") &&
        !configData.includes("update this") &&
        !configData.includes("your_session_id_here")) {
      log.success("SESSION_ID already configured");
      return;
    }
    let sessionId = '';
    while (!sessionId) {
      sessionId = await ask('🍎 Enter your SESSION_ID:\n🍎 Enter your SESSION_ID: ');
      if (!sessionId) {
        log.warning("SESSION_ID cannot be empty. Please try again.");
        continue;
      }
      if (sessionId.length < 10) {
        const confirm = await ask('⚠️  SESSION_ID seems short. Continue anyway? (y/n): ');
        if (confirm.toLowerCase() !== 'y') {
          sessionId = '';
          continue;
        }
      }
    }
    await updateConfigJs(sessionId);
  } catch (error) {
    log.error(`Failed to setup SESSION_ID: ${error.message}`);
    throw error;
  }
}

function checkDependenciesExist() {
  const nodeModulesPath = path.join(CLONE_DIR, 'node_modules');
  const packageJsonPath = path.join(CLONE_DIR, 'package.json');
  
  // Check if node_modules exists
  if (!fs.existsSync(nodeModulesPath)) {
    log.warning("node_modules directory not found");
    return false;
  }
  
  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    log.warning("package.json not found");
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for essential dependencies
    const essentialDeps = Object.keys(dependencies).slice(0, 5); // Check first 5 dependencies
    let foundDeps = 0;
    
    for (const dep of essentialDeps) {
      const depPath = path.join(nodeModulesPath, dep);
      if (fs.existsSync(depPath)) {
        foundDeps++;
      }
    }
    
    // If at least 80% of essential dependencies exist, consider it installed
    const threshold = Math.ceil(essentialDeps.length * 0.8);
    if (foundDeps >= threshold) {
      log.success(`Dependencies already installed (${foundDeps}/${essentialDeps.length} essential deps found)`);
      return true;
    } else {
      log.warning(`Only ${foundDeps}/${essentialDeps.length} essential dependencies found`);
      return false;
    }
  } catch (error) {
    log.warning(`Could not verify dependencies: ${error.message}`);
    return false;
  }
}

async function installDependencies() {
  // First check if dependencies already exist
  log.progress("Checking existing dependencies...");
  if (checkDependenciesExist()) {
    log.success("✅ Dependencies already installed - skipping installation");
    return;
  }
  
  log.info("📦 Dependencies not found - installing now...");
  const packageManager = getPackageManager();
  const maxAttempts = 3;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log.info(`Installing dependencies (attempt ${attempt}/${maxAttempts}) using ${packageManager}...`);
      
      if (attempt > 1) {
        log.info("Clearing package manager cache...");
        try {
          if (packageManager === 'yarn') {
            await executeCommand('yarn cache clean', { cwd: CLONE_DIR, silent: true });
          } else {
            await executeCommand('npm cache clean --force', { cwd: CLONE_DIR, silent: true });
          }
        } catch {
          log.warning("Could not clear cache, continuing...");
        }
      }
      
      const installCommand = packageManager === 'yarn'
        ? 'yarn install --network-timeout 100000 --frozen-lockfile --non-interactive'
        : 'npm install --no-audit --no-fund --prefer-offline';
        
      await executeCommand(installCommand, { cwd: CLONE_DIR });
      log.success("Dependencies installed successfully");
      return;
    } catch (error) {
      log.error(`Installation attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxAttempts) {
        log.info("Retrying in 3 seconds...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        if (packageManager === 'yarn' && attempt === 2) {
          log.info("Trying with npm as fallback...");
        }
      } else {
        log.error("All installation attempts failed");
        throw error;
      }
    }
  }
}

async function startBot() {
  try {
    log.info("Starting 𝐀ɭīī 𝐌𝐃 𝐁❍𝐓...");
    const packageJsonPath = path.join(CLONE_DIR, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (!packageJson.scripts || !packageJson.scripts.start) {
        log.warning("No start script found in package.json, trying direct node execution...");
        await executeCommand('node index.js', { cwd: CLONE_DIR });
        return;
      }
    }
    await executeCommand('npm start', { cwd: CLONE_DIR });
  } catch (error) {
    log.error(`Failed to start bot: ${error.message}`);
    const alternatives = ['node .', 'node index.js', 'node main.js', 'node bot.js'];
    for (const alt of alternatives) {
      try {
        log.info(`Trying alternative start method: ${alt}`);
        await executeCommand(alt, { cwd: CLONE_DIR });
        return;
      } catch {
        continue;
      }
    }
    throw new Error("Could not start the bot with any method");
  }
}

async function main() {
  try {
    log.info("💖 𝐀ɭīī 𝐌𝐃 𝐁❍𝐓 Setup Started");
    log.info(`Platform: ${os.platform()} ${os.arch()}`);
    log.info(`Node.js: ${process.version}`);
    
    log.progress("Checking prerequisites...");
    checkPrerequisites();
    log.success("Prerequisites check passed");
    
    await cloneRepository();
    
    log.progress("Setting up SESSION_ID...");
    await setupSessionId();
    
    log.progress("Checking and installing dependencies if needed...");
    await installDependencies();
    
    log.progress("Starting bot...");
    await startBot();
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    log.info("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure you have a stable internet connection");
    console.log("2. Try running the script with administrator/sudo privileges");
    console.log("3. Clear npm cache: npm cache clean --force");
    console.log("4. Delete node_modules and try again");
    console.log("5. Check if your SESSION_ID is correct");
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log.info("\n👋 Setup interrupted by user");
  process.exit(0);
});

main();
