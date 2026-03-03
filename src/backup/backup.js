const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const logger = require('../utils/logger');

class BackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    startSchedule() {
        // Backup setiap jam 3 pagi
        cron.schedule('0 3 * * *', async () => {
            await this.createBackup();
        }, {
            timezone: process.env.TIMEZONE || 'Asia/Jakarta'
        });
        
        logger.info('✅ Backup scheduler started');
    }

    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filepath = path.join(this.backupDir, filename);
        
        return new Promise((resolve, reject) => {
            // Parse DATABASE_URL
            const dbUrl = new URL(process.env.DATABASE_URL);
            const database = dbUrl.pathname.substring(1);
            const username = dbUrl.username;
            const password = dbUrl.password;
            const host = dbUrl.hostname;
            const port = dbUrl.port || 5432;
            
            // Set PGPASSWORD environment variable untuk pg_dump
            process.env.PGPASSWORD = password;
            
            const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f ${filepath}`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error('Backup error:', error);
                    reject(error);
                } else {
                    logger.info(`✅ Backup created: ${filename}`);
                    
                    // Clean old backups (7 hari)
                    this.cleanOldBackups();
                    
                    resolve(filepath);
                }
            });
        });
    }

    cleanOldBackups() {
        const files = fs.readdirSync(this.backupDir);
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        files.forEach(file => {
            const filepath = path.join(this.backupDir, file);
            const stats = fs.statSync(filepath);
            if (now - stats.mtimeMs > sevenDays) {
                fs.unlinkSync(filepath);
                logger.info(`Deleted old backup: ${file}`);
            }
        });
    }

    async restoreBackup(filename) {
        const filepath = path.join(this.backupDir, filename);
        
        return new Promise((resolve, reject) => {
            const dbUrl = new URL(process.env.DATABASE_URL);
            const database = dbUrl.pathname.substring(1);
            const username = dbUrl.username;
            const password = dbUrl.password;
            const host = dbUrl.hostname;
            const port = dbUrl.port || 5432;
            
            process.env.PGPASSWORD = password;
            
            const command = `pg_restore -h ${host} -p ${port} -U ${username} -d ${database} -c ${filepath}`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error('Restore error:', error);
                    reject(error);
                } else {
                    logger.info(`✅ Database restored from: ${filename}`);
                    resolve(true);
                }
            });
        });
    }
}

module.exports = new BackupService();
