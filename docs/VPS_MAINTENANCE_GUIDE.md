# MarqaSouq VPS Maintenance & Protection Guide

**Server:** srv1196947.hstgr.cloud (72.61.240.40)  
**Provider:** Hostinger VPS  
**OS:** Ubuntu 22.04 LTS  
**Last Updated:** February 25, 2026

---

## ⚠️ CRITICAL: Preventing Future Suspensions

### Why Hostinger Suspends VPS:
1. **High CPU usage** (>90% sustained) - Most common
2. **Memory exhaustion** causing swap thrashing
3. **Disk full** blocking operations
4. **Security vulnerabilities** being exploited (crypto miners)
5. **Outdated packages** with known CVEs

---

## 🛡️ Protection Measures Implemented

### 1. Memory Limits (PM2 Ecosystem)
```javascript
// /var/www/marqa-souq/ecosystem.config.js
max_memory_restart: "1500M"  // Backend: auto-restart if exceeds 1.5GB
max_memory_restart: "1000M"  // Frontend: auto-restart if exceeds 1GB
```

### 2. Automatic Health Monitoring
- **Script:** `/usr/local/bin/check-health.sh`
- **Runs:** Every 5 minutes via cron
- **Actions:**
  - Logs CPU, memory, disk usage
  - Auto-restarts PM2 if memory > 95%
  - Clears logs if disk > 85%
  - Restarts crashed apps automatically

### 3. Security Tools Installed
| Tool | Purpose |
|------|---------|
| **fail2ban** | Blocks brute force SSH attacks |
| **UFW Firewall** | Only allows ports 22, 80, 443, 3000, 9000 |
| **unattended-upgrades** | Auto-installs security patches |
| **logrotate** | Prevents log files from filling disk |

### 4. Firewall Rules
```bash
22/tcp   - SSH
80/tcp   - HTTP
443/tcp  - HTTPS
3000/tcp - Next.js Frontend
9000/tcp - Medusa Backend
```

---

## 📋 Weekly Maintenance Checklist

### Every Monday (5 minutes)
```bash
# SSH to server
ssh root@72.61.240.40

# 1. Check overall health
htop  # Press 'q' to exit

# 2. Check PM2 status
pm2 list
pm2 monit  # Press Ctrl+C to exit

# 3. Check disk space
df -h

# 4. Check recent logs
tail -50 /var/log/marqasouq-health.log

# 5. Check fail2ban status
fail2ban-client status sshd
```

### Monthly (15 minutes)
```bash
# 1. Update system packages
apt update && apt upgrade -y

# 2. Check for Node.js/npm updates
npm -g outdated

# 3. Clean old logs and cache
pm2 flush
apt autoremove -y
apt clean

# 4. Check security status
fail2ban-client status
ufw status
```

---

## 🚨 Emergency Response Procedures

### If VPS Gets Suspended Again:

#### Step 1: Contact Hostinger
Reply to ticket: "Yes, I will reduce resource usage"

#### Step 2: Once Unsuspended, Run:
```bash
ssh root@72.61.240.40

# Kill any malware/miners
pkill -9 -f kdevtmpfsi
pkill -9 -f kinsing
pkill -9 -f xmrig
pkill -9 -f minerd

# Clean temp files
rm -rf /tmp/* /var/tmp/*

# Clean crontabs (malware often hides here)
crontab -r
echo "" | crontab -

# Restart services
pm2 restart all
```

#### Step 3: Check What Caused High Usage:
```bash
# Check top processes
top -o %CPU

# Check PM2 logs for errors
pm2 logs --lines 100

# Check system logs
journalctl -xe --no-pager | tail -100
```

### If Website is Down but VPS is Running:

```bash
# Check PM2 status
pm2 list

# If stopped, restart
pm2 restart all

# If still failing, check logs
pm2 logs medusa-backend --lines 50
pm2 logs nextjs-storefront --lines 50

# Check Nginx
systemctl status nginx
systemctl restart nginx
```

---

## 📦 Package Version Requirements

### ALWAYS keep these updated to prevent vulnerabilities:

| Package | Minimum Safe Version | Current |
|---------|---------------------|---------|
| **Next.js** | 15.5.7+ or 16.x | 16.1.6 ✅ |
| **React** | 19.1.2+ | 19.2.4 ✅ |
| **Node.js** | 18.x or 20.x LTS | Check with `node -v` |

### How to Update Frontend:
```bash
cd /var/www/marqa-souq/frontend/markasouq-web
git pull origin main
npm install
npm audit fix
npm run build
pm2 restart nextjs-storefront
```

### How to Update Backend:
```bash
cd /var/www/marqa-souq/backend/backend-medusa
git pull origin main
npm install
npm run build
pm2 restart medusa-backend
```

---

## 📊 Resource Limits & Thresholds

### Warning Thresholds:
| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU Load | > 4.0 | > 8.0 | Investigate, restart apps |
| Memory | > 75% | > 90% | Restart PM2 apps |
| Disk | > 80% | > 90% | Clear logs, old files |
| PM2 Restarts | > 5/hour | > 10/hour | Check logs, fix issue |

### Monitoring Commands:
```bash
# Real-time system monitor
htop

# Real-time PM2 monitor
pm2 monit

# Check memory
free -m

# Check disk
df -h

# Check network connections
netstat -tlnp
```

---

## 🔧 Useful Commands Reference

### PM2 Commands:
```bash
pm2 list                    # Show all apps
pm2 restart all             # Restart all apps
pm2 restart medusa-backend  # Restart specific app
pm2 logs                    # View logs (Ctrl+C to exit)
pm2 monit                   # Real-time monitor
pm2 flush                   # Clear all logs
pm2 save                    # Save current config
```

### Service Commands:
```bash
systemctl status nginx      # Check Nginx
systemctl restart nginx     # Restart Nginx
systemctl status postgresql # Check PostgreSQL
systemctl restart postgresql # Restart PostgreSQL
```

### Security Commands:
```bash
fail2ban-client status sshd  # Check banned IPs
fail2ban-client unban <IP>   # Unban an IP
ufw status                   # Check firewall rules
ufw allow <port>/tcp         # Open a port
```

---

## 📞 Emergency Contacts

### Hostinger Support:
- **Live Chat:** Available 24/7 in hPanel
- **Ticket System:** For suspension issues

### Important URLs:
- **Website:** https://website.markasouqs.com
- **Admin:** https://admin.markasouqs.com/app
- **API Health:** https://admin.markasouqs.com/health
- **Hostinger hPanel:** https://hpanel.hostinger.com

---

## 📝 Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-02-25 | Fixed Next.js vulnerability (15.5.4 → 16.1.6) | System |
| 2026-02-25 | Installed fail2ban, UFW, monitoring tools | System |
| 2026-02-25 | Configured PM2 memory limits | System |
| 2026-02-25 | Set up automated health checks | System |
| 2026-02-25 | Enabled automatic security updates | System |

---

## ✅ Quick Health Check (Run Daily)

```bash
ssh root@72.61.240.40 'echo "=== HEALTH CHECK ===" && uptime && echo "" && free -m && echo "" && df -h / && echo "" && pm2 list && echo "" && curl -s http://localhost:9000/health && echo " Backend OK" && curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000'
```

Expected output:
- Load average < 2.0
- Memory used < 75%
- Disk used < 80%
- Both PM2 apps "online"
- Backend returns "OK"
- Frontend returns 200/307

---

**Remember:** Prevention is better than recovery. Run the weekly checklist every Monday!
