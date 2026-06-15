# Eraikuntza fasea (Build stage)
FROM node:22-alpine AS builder

# Lan karpeta zehaztu
WORKDIR /app

# Fitxategiak kopiatu mendekotasunak instalatzeko
COPY package.json pnpm-lock.yaml* ./

# pnpm instalatu aurrera egin aurretik
RUN npm install -g pnpm@10

# Proiektuaren mendekotasunak instalatu
RUN pnpm install

# Gainontzeko kodea kopiatu
COPY . .

# Proiektua eraiki (build)
RUN pnpm run build

# Zuzendaritza fasea (Serve stage nginx-rekin)
FROM nginx:alpine

# Nginx konfigurazio pertsonalizatua kopiatzeko (hautazkoa)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Eraikitako fitxategiak nginx karpetara eraman
COPY --from=builder /app/dist /usr/share/nginx/html

# Portua 80
EXPOSE 80

# Nginx martxan jarri
CMD ["nginx", "-g", "daemon off;"]
