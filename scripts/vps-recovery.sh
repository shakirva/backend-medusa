#!/bin/bash

# ============================================
# MarqaSouq VPS Recovery Script
# Run this after starting VPS from Hostinger
# ============================================

echo "=========================================="
echo "MarqaSouq VPS Recovery - Starting..."
echo "=========================================="

# 1. Check system status
echo ""
echo "=== SYSTEM STATUS ==="
uptime
free -m
df -h

# 2. Check for malicious processes
echo ""
echo "=== CHECKING FOR MALICIOUS PROCESSES ==="
# Common crypto miners and malware processes
ps aux | grep -E "(kdevtmpfsi|kinsing|xmrig|minerd|cpuminer|crypto)" | grep -v grep

# 3. Check crontabs for suspicious entries
echo ""
echo "=== CHECKING CRONTABS ==="
crontab -l 2>/dev/null
ls -la /etc/cron.d/

# 4. Check for suspicious files in common locations
echo ""
echo "=== CHECKING SUSPICIOUS LOCATIONS ==="
ls -la /tmp/*.sh 2>/dev/null
ls -la /var/tmp/*.sh 2>/dev/null
ls -la /dev/shm/ 2>/dev/null

# 5. Remove common malware (if found)
echo ""
echo "=== REMOVING KNOWN MALWARE ==="
# Kill common crypto miner processes
pkill -9 -f kdevtmpfsi 2>/dev/null
pkill -9 -f kinsing 2>/dev/null
pkill -9 -f xmrig 2>/dev/null
pkill -9 -f minerd 2>/dev/null

# Remove common malware files
rm -f /tmp/kdevtmpfsi 2>/dev/null
rm -f /tmp/kinsing 2>/dev/null
rm -f /var/tmp/kdevtmpfsi 2>/dev/null
rm -f /var/tmp/kinsing 2>/dev/null

# Clean suspicious cron entries
crontab -r 2>/dev/null
echo "# Clean crontab" | crontab -

# 6. Update system and security patches
echo ""
echo "=== UPDATING SYSTEM ==="
apt-get update
apt-get upgrade -y
apt-get install -y fail2ban ufw

# 7. Configure firewall
echo ""
echo "=== CONFIGURING FIREWALL ==="
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9000/tcp   # Medusa backend
ufw allow 3000/tcp   # Next.js frontend
echo "y" | ufw enable

# 8. Start essential services
echo ""
echo "=== STARTING SERVICES ==="
systemctl start nginx 2>/dev/null || echo "Nginx not installed"
systemctl start postgresql 2>/dev/null || echo "PostgreSQL not installed"
systemctl start docker 2>/dev/null || echo "Docker not installed"
systemctl start redis-server 2>/dev/null || echo "Redis not installed"

# 9. Check Docker containers (if using Docker)
echo ""
echo "=== DOCKER STATUS ==="
docker ps -a 2>/dev/null || echo "Docker not running"

# 10. Check if MarqaSouq services are running
echo ""
echo "=== MARQASOUQ SERVICES ==="
# Check PM2 processes
pm2 list 2>/dev/null || echo "PM2 not running"

# 11. Restart MarqaSouq applications
echo ""
echo "=== RESTARTING MARQASOUQ APPS ==="
cd /var/www/marqasouq/backend 2>/dev/null && pm2 restart all 2>/dev/null
cd /var/www/marqasouq/frontend 2>/dev/null && pm2 restart all 2>/dev/null

# Alternative: If using ecosystem.config.js
pm2 start ecosystem.config.js 2>/dev/null

# 12. Check service ports
echo ""
echo "=== CHECKING PORTS ==="
netstat -tlnp | grep -E "(9000|3000|80|443|5432|6379)"

# 13. Test endpoints
echo ""
echo "=== TESTING ENDPOINTS ==="
curl -s http://localhost:9000/health 2>/dev/null && echo "Backend: OK" || echo "Backend: NOT RESPONDING"
curl -s http://localhost:3000 2>/dev/null | head -c 100 && echo "Frontend: OK" || echo "Frontend: NOT RESPONDING"

echo ""
echo "=========================================="
echo "Recovery script completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check the outputs above for any errors"
echo "2. If services aren't starting, check logs:"
echo "   - pm2 logs"
echo "   - journalctl -u nginx -f"
echo "   - docker logs <container_name>"
echo "3. Access your site: https://marqasouq.com"
echo ""
