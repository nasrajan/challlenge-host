#!/bin/bash

#挑战 Forge - Automated Database Backup Script
# This script is designed to be run manually or via a cron job.

# Configuration - Explicit URLs
DEV_URL="postgresql://neondb_owner:npg_LNvAyIMF0VH1@ep-dawn-cherry-aipdttfv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
PROD_URL="postgresql://neondb_owner:npg_HLv6GbuE1SIA@ep-rough-waterfall-ai2lowah-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

PARENT_PATH="$( cd -- "$(dirname "$0")"/.. >/dev/null 2>&1 ; pwd -P )"
BACKUP_DIR="$PARENT_PATH/backups"

# 1. Parse Environment Argument
ENV_TYPE=$1

if [ "$ENV_TYPE" == "dev" ]; then
    DB_URL=$DEV_URL
    ENV_NAME="dev"
elif [ "$ENV_TYPE" == "prod" ]; then
    DB_URL=$PROD_URL
    ENV_NAME="prod"
else
    echo "Usage: $0 [dev|prod]"
    exit 1
fi

# 2. Setup Backup Destination
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_${ENV_NAME}_$TIMESTAMP.bak"

echo "[$TIMESTAMP] Starting backup to $BACKUP_FILE..."

# 3. Execute pg_dump
# We use the full connection string with custom format (-Fc) and verbose (-v) logging.
if ! command -v pg_dump &> /dev/null; then
    echo "Error: pg_dump not found. Please install postgresql-client."
    exit 1
fi

pg_dump -Fc -v -d "$DB_URL" -f "$BACKUP_FILE"

# 4. Handle Completion
if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] Backup successful."
    
    # 5. Retention Policy: Keep only last 30 days of .bak backups
    echo "[$TIMESTAMP] Cleaning up old backups (30+ days)..."
    find "$BACKUP_DIR" -maxdepth 1 -name "db_backup_*.bak" -mtime +30 -exec rm {} \;
    
    echo "[$TIMESTAMP] Done."
else
    echo "[$TIMESTAMP] ERROR: pg_dump failed!"
    exit 1
fi
