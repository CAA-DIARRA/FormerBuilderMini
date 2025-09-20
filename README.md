# 📋 Form Builder — Version minimale (Next.js + Prisma)

Application pour créer des formulaires d'évaluation de formation, partager un lien/QR, collecter des réponses et exporter en Excel.

## Installation
```bash
npm install
cp .env.example .env
# édite DATABASE_URL, NEXTAUTH_SECRET
npx prisma migrate dev -n init
npm run dev
```
Ouvre http://localhost:3000

## Pages
- `/dashboard` — liste des formulaires
- `/forms/new` — création
- `/forms/[formId]/edit` — édition
- `/f/[slug]` — formulaire public

## API
- `POST/GET /api/forms`
- `GET/PATCH/DELETE /api/forms/[formId]`
- `POST /api/forms/[formId]/responses`
- `GET /api/forms/[formId]/stats`
- `GET /api/forms/[formId]/export`
- `GET /api/forms/[formId]/qrcode`
# FormerBuilderMini
# FormerBuilderMini
