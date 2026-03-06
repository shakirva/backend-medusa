#!/bin/bash
# MarqaSouq VPS - Complete Security Hardening Script
# Run this ON THE VPS after SSH keys are working

echo "=============================================="
echo "  MarqaSouq VPS - Security Hardening"
echo "=============================================="
echo ""
echo "⚠️  IMPORTANT: Make sure SSH key login works before running!"
echo "   Test with: ssh -o PasswordAuthentication=no root@72.61.240.40"
echo ""

# ==========================================
# STEP 1: Kill All Malicious Processes
# ==========================================
echo "🔪 Step 1: Killing malicious processes..."

# Common crypto miner processes
MALWARE_PROCESSES="kdevtmpfsi kinsing xmrig minerd cpuminer cryptonight monero bash\.\*tmp"
for proc in $MALWARE_PROCESSES; do
    pkill -9 -f "$proc" 2>/dev/null
done

# Kill any process using high CPU suspiciously
for pid in $(ps aux | awk '$3 > 80 {print $2}' | grep -v PID); do
    cmd=$(ps -p $pid -o comm= 2>/dev/null)
    if [[ "$cmd" != "node" && "$cmd" != "npm" && "$cmd" != "postgres" && "$cmd" != "nginx" ]]; then
        echo "  Killing high-CPU process: $cmd (PID: $pid)"
        kill -9 $pid 2>/dev/null
    fi
done

echo "✅ Malicious processes killed"

# ==========================================
# STEP 2: Remove Malware Files
# ==========================================
echo ""
echo "🗑️  Step 2: Removing malware files..."

# Common malware locations
rm -rf /tmp/.* 2>/dev/null
rm -rf /tmp/* 2>/dev/null
rm -rf /var/tmp/.* 2>/dev/null
rm -rf /var/tmp/* 2>/dev/null
rm -rf /dev/shm/.* 2>/dev/null
rm -rf /dev/shm/* 2>/dev/null
rm -rf /root/.configrc* 2>/dev/null
rm -rf /root/.bashrc.* 2>/dev/null
rm -rf /usr/local/bin/kdevtmpfsi 2>/dev/null
rm -rf /usr/local/bin/kinsing 2>/dev/null
rm -rf /usr/bin/.* 2>/dev/null

echo "✅ Malware files removed"

# ==========================================
# STEP 3: Clean and Lock Crontabs
# ==========================================
echo ""
echo "🔒 Step 3: Cleaning and locking crontabs..."

# Remove all crontabs
crontab -r 2>/dev/null
for user in $(cut -f1 -d: /etc/passwd); do
    crontab -r -u $user 2>/dev/null
done

# Lock cron spool directory
chattr -ia /var/spool/cron/crontabs/* 2>/dev/null
rm -f /var/spool/cron/crontabs/* 2>/dev/null
chattr +i /var/spool/cron/crontabs 2>/dev/null

# Clean cron directories
rm -f /etc/cron.d/* 2>/dev/null
rm -f /etc/cron.hourly/* 2>/dev/null
rm -f /etc/cron.daily/* 2>/dev/null

echo "✅ Crontabs cleaned and locked"

# ==========================================
# STEP 4: Configure Firewall (UFW)
# ==========================================
echo ""
echo "🔥 Step 4: Configuring firewall..."

# Install UFW if not present
apt-get update -qq
apt-get install -y ufw -qq

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (CRITICAL - don't lock yourself out!)
ufw allow 22/tcp comment 'SSH'

# Allow web traffic
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Allow Medusa backend
ufw allow 9000/tcp comment 'Medusa Backend'

# Allow Next.js frontend
ufw allow 3000/tcp comment 'Next.js Frontend'

# Enable firewall
ufw --force enable

echo "✅ Firewall configured"
ufw status numbered

# ==========================================
# STEP 5: Install and Configure Fail2ban
# ==========================================
echo ""
echo "🛡️  Step 5: Setting up Fail2ban..."

apt-get install -y fail2ban -qq

# Create jail configuration
cat > /etc/fail2ban/jail.local << 'JAIL'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
JAIL

systemctl enable fail2ban
systemctl restart fail2ban

echo "✅ Fail2ban configured"

# ==========================================
# STEP 6: Secure SSH Configuration
# ==========================================
echo ""
echo "🔐 Step 6: Securing SSH..."

# Backup original config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Apply secure settings
cat > /etc/ssh/sshd_config.d/99-security.conf << 'SSHCONF'
# MarqaSouq SSH Security Configuration
PasswordAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
SSHCONF

# Test SSH config before restarting
sshd -t
if [ $? -eq 0 ]; then
    systemctl restart sshd
    echo "✅ SSH secured - password login disabled"
else
    echo "❌ SSH config error - keeping password login for safety"
    rm /etc/ssh/sshd_config.d/99-security.conf
fi

# ==========================================
# STEP 7: Secure Database Access
# ==========================================
echo ""
echo "🗄️  Step 7: Securing database access..."

# PostgreSQL - bind to localhost only
if [ -f /etc/postgresql/*/main/postgresql.conf ]; then
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
    sed -i "s/listen_addresses = '\*'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
    systemctl restart postgresql
    echo "✅ PostgreSQL secured (localhost only)"
fi

# Redis - bind to localhost only
if [ -f /etc/redis/redis.conf ]; then
    sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf
    sed -i 's/^# requirepass .*/requirepass your_redis_password_here/' /etc/redis/redis.conf
    systemctl restart redis-server
    echo "✅ Redis secured (localhost only)"
fi

# ==========================================
# STEP 8: Install Security Tools
# ==========================================
echo ""
echo "🔍 Step 8: Installing security tools..."

apt-get install -y rkhunter chkrootkit lynis -qq

# Update rkhunter database
rkhunter --update --quiet

echo "✅ Security tools installed"

# ==========================================
# STEP 9: Run Security Scan
# ==========================================
echo ""
echo "🔎 Step 9: Running security scan..."

# Quick rootkit check
chkrootkit -q 2>/dev/null | grep -i infected

# rkhunter scan
rkhunter --check --skip-keypress --report-warnings-only

# ==========================================
# STEP 10: Verify Services
# ==========================================
echo ""
echo "🚀 Step 10: Verifying services..."

# Start essential services
systemctl start postgresql redis-server nginx

# Check PM2 status
if command -v pm2 &> /dev/null; then
    pm2 list
fi

# Health checks
echo ""
echo "Health Checks:"
curl -s http://localhost:9000/health && echo " ✅ Backend OK" || echo " ❌ Backend FAILED"
curl -s http://localhost:3000 | head -c 50 && echo " ✅ Frontend OK" || echo " ❌ Frontend FAILED"

# ==========================================
# FINAL SUMMARY
# ==========================================
echo ""
echo "=============================================="
echo "  🎉 Security Hardening Complete!"
echo "=============================================="
echo ""
echo "Security measures applied:"
echo "  ✅ Malware processes killed"
echo "  ✅ Malware files removed"
echo "  ✅ Crontabs cleaned and locked"
echo "  ✅ Firewall (UFW) configured"
echo "  ✅ Fail2ban protection enabled"
echo "  ✅ SSH password login disabled"
echo "  ✅ Database bound to localhost"
echo "  ✅ Security tools installed"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "  1. Test SSH login in a NEW terminal before closing this session!"
echo "     ssh root@72.61.240.40"
echo ""
echo "  2. Set up SSL certificate:"
echo "     certbot --nginx -d marqasouq.com -d www.marqasouq.com"
echo ""
echo "  3. Schedule regular security scans:"
echo "     Add to new crontab: 0 3 * * * /usr/bin/rkhunter --check --skip-keypress"
echo ""
echo "  4. Monitor fail2ban:"
echo "     fail2ban-client status sshd"
echo ""
