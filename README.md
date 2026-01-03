# BSU Chat Platform

Bakı Dövlət Universiteti tələbələri üçün real-time chat platforması.

## Xüsusiyyətlər

- 16 fakültə üçün ayrı-ayrı chat otaqları
- Real-time mesajlaşma (Socket.IO)
- Şəxsi mesajlaşma sistemi
- İstifadəçi blok və report funksiyaları
- Admin paneli (super admin və alt adminlər)
- Avtomatik mesaj filtrasiyası
- Bakı timezone ilə mesaj vaxtı
- Avtomatik mesaj silinmə sistemi

## Texnologiyalar

### Backend
- Node.js + Express
- PostgreSQL + Prisma ORM
- Socket.IO
- JWT Authentication
- bcryptjs

### Frontend
- React + Vite
- React Router
- Socket.IO Client
- Axios
- Lucide React Icons

## Railway Deployment

### Environment Variables

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=production
SUPER_ADMIN_USERNAME=ursamajor
SUPER_ADMIN_PASSWORD=ursa618
```

### Deployment Addımları

1. Railway layihəsi yaradın
2. PostgreSQL addon əlavə edin
3. Environment variables təyin edin
4. GitHub repository-ni bağlayın
5. Deploy edin

## Local Development

```bash
# Install dependencies
npm install

# Setup database
cd backend && npx prisma migrate dev

# Run development
npm run dev
```

## Super Admin Giriş

- Username: `ursamajor`
- Password: `ursa618`

## License

MIT
