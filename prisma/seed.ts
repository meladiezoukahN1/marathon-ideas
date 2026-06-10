import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Event
  const event = await prisma.event.upsert({
    where: { id: "event-001" },
    update: {},
    create: {
      id: "event-001",
      name: "ماراثون الأفكار 2025",
      description: "منافسة الأفكار الريادية بين أفضل المشاريع",
      status: "ACTIVE",
    },
  });

  // SuperAdmin
  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      name: "المدير الرئيسي",
      password: await bcrypt.hash("Super@2025", 12),
      role: "SUPERADMIN",
      eventId: event.id,
    },
  });

  // Admin
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "مدير النظام",
      password: await bcrypt.hash("Admin@2025", 12),
      role: "ADMIN",
      eventId: event.id,
    },
  });

  // 5 Jury members
  for (let i = 1; i <= 5; i++) {
    await prisma.user.upsert({
      where: { username: `jury${i}` },
      update: {},
      create: {
        username: `jury${i}`,
        name: `محكم ${i}`,
        password: await bcrypt.hash(`Jury${i}@2025`, 12),
        role: "JURY",
        eventId: event.id,
      },
    });
  }

  // Challenge A — Digital
  const cA = await prisma.challenge.upsert({
    where: { eventId_slug: { eventId: event.id, slug: "digital" } },
    update: {},
    create: {
      eventId: event.id,
      name: "التحول الرقمي والخدمات الحكومية",
      description: "حلول رقمية مبتكرة لتحسين الخدمات الحكومية والاجتماعية",
      slug: "digital",
      order: 1,
      status: "ACTIVE",
    },
  });
  await prisma.team.upsert({
    where: { challengeId_slot: { challengeId: cA.id, slot: "TEAM1" } },
    update: {},
    create: {
      challengeId: cA.id, slot: "TEAM1",
      name: "فريق الرؤية الرقمية",
      idea: "منصة موحدة لتقديم الخدمات الحكومية إلكترونياً مع دعم الذكاء الاصطناعي لتوجيه المواطنين وتسريع المعاملات",
    },
  });
  await prisma.team.upsert({
    where: { challengeId_slot: { challengeId: cA.id, slot: "TEAM2" } },
    update: {},
    create: {
      challengeId: cA.id, slot: "TEAM2",
      name: "فريق التحول الذكي",
      idea: "تطبيق موبايل يربط المواطن بجميع الجهات الحكومية مع إشعارات فورية وتتبع الطلبات والمدفوعات",
    },
  });

  // Challenge B — Agriculture
  const cB = await prisma.challenge.upsert({
    where: { eventId_slug: { eventId: event.id, slug: "agriculture" } },
    update: {},
    create: {
      eventId: event.id,
      name: "الزراعة والأمن الغذائي",
      description: "مشاريع تعزز الأمن الغذائي وتطور القطاع الزراعي",
      slug: "agriculture",
      order: 2,
    },
  });
  await prisma.team.upsert({
    where: { challengeId_slot: { challengeId: cB.id, slot: "TEAM1" } },
    update: {},
    create: {
      challengeId: cB.id, slot: "TEAM1",
      name: "فريق الحصاد الذكي",
      idea: "نظام استشعار IoT لمراقبة التربة والمحاصيل وتحسين استخدام المياه بنسبة 40% مع تنبيهات آنية",
    },
  });
  await prisma.team.upsert({
    where: { challengeId_slot: { challengeId: cB.id, slot: "TEAM2" } },
    update: {},
    create: {
      challengeId: cB.id, slot: "TEAM2",
      name: "فريق الغذاء المستدام",
      idea: "سوق رقمي يربط المزارعين مباشرة بالمستهلكين مع ضمان سلسلة تبريد آمنة وتتبع الجودة",
    },
  });

  // Challenge C — Transport
  const cC = await prisma.challenge.upsert({
    where: { eventId_slug: { eventId: event.id, slug: "transport" } },
    update: {},
    create: {
      eventId: event.id,
      name: "النقل والخدمات الذكية",
      description: "حلول النقل الذكي وتحسين تجربة التنقل في المدن",
      slug: "transport",
      order: 3,
    },
  });
  await prisma.team.upsert({
    where: { challengeId_slot: { challengeId: cC.id, slot: "TEAM1" } },
    update: {},
    create: {
      challengeId: cC.id, slot: "TEAM1",
      name: "فريق المدينة الذكية",
      idea: "منظومة إشارات مرورية ذكية تعمل بالذكاء الاصطناعي لتقليل الازدحام بنسبة 35% وتوفير الوقت",
    },
  });
  await prisma.team.upsert({
    where: { challengeId_slot: { challengeId: cC.id, slot: "TEAM2" } },
    update: {},
    create: {
      challengeId: cC.id, slot: "TEAM2",
      name: "فريق التنقل الأخضر",
      idea: "تطبيق لمشاركة وسائل النقل الكهربائي مع نظام نقاط مكافأة للمستخدمين وتخفيض انبعاثات الكربون",
    },
  });

  console.log("✅ Seed complete!");
  console.log("─".repeat(40));
  console.log("superadmin, admin, and jury users seeded");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
