# Image ships Google Chrome (found via /usr/bin/google-chrome or CHROME_PATH).
FROM apify/actor-node-puppeteer-chrome:22
USER root
# Fonts so Hebrew, Arabic, CJK and emoji render instead of boxes
RUN apt-get update && apt-get install -y --no-install-recommends fonts-noto-core fonts-noto-cjk fonts-noto-color-emoji \
 && rm -rf /var/lib/apt/lists/*
USER myuser
COPY --chown=myuser:myuser package*.json ./
RUN npm --quiet set progress=false && npm install --omit=dev --omit=optional --no-audit --no-fund
COPY --chown=myuser:myuser . ./
CMD ["npm", "start", "--silent"]
