const os = require('os');
const logger = require('../shared/logger');

class UptimeService {
  constructor() {
    this.startTime = Date.now();
    this.checks = [];
  }

  getSystemInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      loadAvg: os.loadavg()
    };
  }

  getBotUptime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  async performHealthCheck() {
    const check = {
      timestamp: Date.now(),
      status: 'healthy',
      checks: {}
    };

    try {
      // Check database
      check.checks.database = await this.checkDatabase();
      
      // Check memory
      check.checks.memory = this.checkMemory();
      
      // Check disk space
      check.checks.disk = await this.checkDiskSpace();
      
      // Overall status
      if (Object.values(check.checks).some(c => c.status === 'critical')) {
        check.status = 'critical';
      } else if (Object.values(check.checks).some(c => c.status === 'warning')) {
        check.status = 'warning';
      }
      
    } catch (error) {
      check.status = 'error';
      check.error = error.message;
    }

    this.checks.push(check);
    
    // Keep only last 100 checks
    if (this.checks.length > 100) {
      this.checks.shift();
    }

    return check;
  }

  async checkDatabase() {
    // Implementation
    return { status: 'healthy', latency: 0 };
  }

  checkMemory() {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 500) {
      return { status: 'critical', used: heapUsedMB };
    } else if (heapUsedMB > 300) {
      return { status: 'warning', used: heapUsedMB };
    }
    
    return { status: 'healthy', used: heapUsedMB };
  }

  async checkDiskSpace() {
    // Implementation
    return { status: 'healthy', free: 1000 };
  }

  getUptimeHistory() {
    return this.checks;
  }
}

module.exports = { UptimeService };
