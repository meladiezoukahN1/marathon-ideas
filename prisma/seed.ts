import "dotenv/config";
import bcrypt from "bcryptjs";

import logger from "../src/lib/logger";
import { prisma } from "../src/lib/prisma/client";

const challenges = [
  {
    slug: "digital",
    nameAr: "التحول الرقمي والخدمات الحكومية والاجتماعية",
    order: 1,
  },
  { slug: "agriculture", nameAr: "الزراعة والأمن الغذائي", order: 2 },
  { slug: "transport", nameAr: "النقل والخدمات الذكية", order: 3 },
] as const;

type ChallengeMap = Record<(typeof challenges)[number]["slug"], string>;

async function seedChallenges(): Promise<ChallengeMap> {
  const map = {} as ChallengeMap;

  for (const challenge of challenges) {
    const saved = await prisma.challenge.upsert({
      where: { slug: challenge.slug },
      update: {
        nameAr: challenge.nameAr,
        order: challenge.order,
      },
      create: {
        slug: challenge.slug,
        nameAr: challenge.nameAr,
        order: challenge.order,
      },
      select: { id: true, slug: true },
    });

    map[saved.slug as keyof ChallengeMap] = saved.id;
  }

  return map;
}

async function seedTeams(challengeIds: ChallengeMap): Promise<void> {
  const teams = [
    {
      id: "team-digital-1",
      challengeSlug: "digital",
      nameAr: "فريق التحول 1",
      ideaAr: "منصة رقمية للخدمات الحكومية",
    },
    {
      id: "team-digital-2",
      challengeSlug: "digital",
      nameAr: "فريق التحول 2",
      ideaAr: "تطبيق الهوية الرقمية",
    },
    {
      id: "team-agriculture-1",
      challengeSlug: "agriculture",
      nameAr: "فريق الزراعة 1",
      ideaAr: "نظام ري ذكي",
    },
    {
      id: "team-agriculture-2",
      challengeSlug: "agriculture",
      nameAr: "فريق الزراعة 2",
      ideaAr: "سوق إلكتروني للمزارعين",
    },
    {
      id: "team-transport-1",
      challengeSlug: "transport",
      nameAr: "فريق النقل 1",
      ideaAr: "تطبيق المواصلات الذكية",
    },
    {
      id: "team-transport-2",
      challengeSlug: "transport",
      nameAr: "فريق النقل 2",
      ideaAr: "نظام مشاركة السيارات",
    },
  ] as const;

  for (const team of teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: { ideaAr: team.ideaAr },
      create: {
        id: team.id,
        challengeId: challengeIds[team.challengeSlug],
        nameAr: team.nameAr,
        ideaAr: team.ideaAr,
      },
      select: { id: true },
    });
  }
}

async function seedMatches(challengeIds: ChallengeMap): Promise<void> {
  const teamPairBySlug: Record<(typeof challenges)[number]["slug"], [string, string]> = {
    digital: ["team-digital-1", "team-digital-2"],
    agriculture: ["team-agriculture-1", "team-agriculture-2"],
    transport: ["team-transport-1", "team-transport-2"],
  };

  for (const challenge of challenges) {
    const [team1Id, team2Id] = teamPairBySlug[challenge.slug];

    await prisma.match.upsert({
      where: { challengeId: challengeIds[challenge.slug] },
      update: {
        team1Id,
        team2Id,
      },
      create: {
        challengeId: challengeIds[challenge.slug],
        team1Id,
        team2Id,
      },
      select: { id: true },
    });
  }
}

async function seedEventControl(): Promise<void> {
  await prisma.eventControl.upsert({
    where: { id: "default-event-control" },
    update: {},
    create: {
      id: "default-event-control",
    },
    select: { id: true },
  });
}

async function seedSuperAdmin(): Promise<void> {
  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error("SUPERADMIN_USERNAME and SUPERADMIN_PASSWORD are required");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { username },
    update: {
      name: "Super Admin",
      passwordHash,
      role: "SUPERADMIN",
      isActive: true,
    },
    create: {
      name: "Super Admin",
      username,
      passwordHash,
      role: "SUPERADMIN",
      isActive: true,
    },
    select: { id: true },
  });
}

async function main(): Promise<void> {
  try {
    const challengeIds = await seedChallenges();
    await seedTeams(challengeIds);
    await seedMatches(challengeIds);
    await seedEventControl();
    await seedSuperAdmin();

    logger.info("Database seed completed successfully");
  } catch (error) {
    logger.error({ err: error }, "Database seed failed");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
