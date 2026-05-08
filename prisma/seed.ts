import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // ── Seasons ──────────────────────────────────────────────────────────────

  const season2425 = await prisma.season.upsert({
    where: { label: "2024-2025" },
    update: {},
    create: { label: "2024-2025", isActive: false },
  })

  const season2526 = await prisma.season.upsert({
    where: { label: "2025-2026" },
    update: { isActive: true },
    create: { label: "2025-2026", isActive: true },
  })

  // ── Teachers ─────────────────────────────────────────────────────────────

  const teachers = await Promise.all([
    prisma.teacher.upsert({
      where: { id: "teacher-1" },
      update: {},
      create: { id: "teacher-1", firstName: "Sophie", lastName: "Marchand" },
    }),
    prisma.teacher.upsert({
      where: { id: "teacher-2" },
      update: {},
      create: { id: "teacher-2", firstName: "Lucie", lastName: "Bertrand" },
    }),
    prisma.teacher.upsert({
      where: { id: "teacher-3" },
      update: {},
      create: { id: "teacher-3", firstName: "Kevin", lastName: "Dupont" },
    }),
    prisma.teacher.upsert({
      where: { id: "teacher-4" },
      update: {},
      create: { id: "teacher-4", firstName: "Amandine", lastName: "Leroy" },
    }),
  ])

  // ── Students ─────────────────────────────────────────────────────────────

  const studentData = [
    { id: "student-01", firstName: "Emma", lastName: "Laurent" },
    { id: "student-02", firstName: "Chloé", lastName: "Martin" },
    { id: "student-03", firstName: "Léa", lastName: "Dubois" },
    { id: "student-04", firstName: "Inès", lastName: "Moreau" },
    { id: "student-05", firstName: "Jade", lastName: "Simon" },
    { id: "student-06", firstName: "Camille", lastName: "Michel" },
    { id: "student-07", firstName: "Alice", lastName: "Fontaine" },
    { id: "student-08", firstName: "Zoé", lastName: "Garnier" },
    { id: "student-09", firstName: "Manon", lastName: "Rousseau" },
    { id: "student-10", firstName: "Lucie", lastName: "Blanc" },
    { id: "student-11", firstName: "Théo", lastName: "Petit" },
    { id: "student-12", firstName: "Hugo", lastName: "Richard" },
    { id: "student-13", firstName: "Noah", lastName: "Thomas" },
    { id: "student-14", firstName: "Liam", lastName: "Bernard" },
    { id: "student-15", firstName: "Axel", lastName: "Robert" },
    { id: "student-16", firstName: "Ella", lastName: "Girard" },
    { id: "student-17", firstName: "Maëlys", lastName: "Bonnet" },
    { id: "student-18", firstName: "Clara", lastName: "Dupuis" },
  ]

  await Promise.all(
    studentData.map((s) =>
      prisma.student.upsert({ where: { id: s.id }, update: {}, create: s })
    )
  )

  // ── Classes (season 2025-2026) ────────────────────────────────────────────

  const classes = await Promise.all([
    prisma.class.upsert({
      where: { id: "class-jazz-1" },
      update: {},
      create: {
        id: "class-jazz-1",
        name: "Jazz Débutants",
        schedule: "Mardi 17h-18h",
        teacherId: teachers[0].id,
        seasonId: season2526.id,
      },
    }),
    prisma.class.upsert({
      where: { id: "class-jazz-2" },
      update: {},
      create: {
        id: "class-jazz-2",
        name: "Jazz Intermédiaires",
        schedule: "Mardi 18h-19h30",
        teacherId: teachers[0].id,
        seasonId: season2526.id,
      },
    }),
    prisma.class.upsert({
      where: { id: "class-hiphop" },
      update: {},
      create: {
        id: "class-hiphop",
        name: "Hip-Hop",
        schedule: "Mercredi 16h-17h30",
        teacherId: teachers[2].id,
        seasonId: season2526.id,
      },
    }),
    prisma.class.upsert({
      where: { id: "class-contemporary" },
      update: {},
      create: {
        id: "class-contemporary",
        name: "Contemporain",
        schedule: "Jeudi 18h-19h30",
        teacherId: teachers[1].id,
        seasonId: season2526.id,
      },
    }),
    prisma.class.upsert({
      where: { id: "class-ballet" },
      update: {},
      create: {
        id: "class-ballet",
        name: "Classique",
        schedule: "Samedi 10h-11h30",
        teacherId: teachers[3].id,
        seasonId: season2526.id,
      },
    }),
    prisma.class.upsert({
      where: { id: "class-eveil" },
      update: {},
      create: {
        id: "class-eveil",
        name: "Éveil corporel (6-8 ans)",
        schedule: "Mercredi 14h-15h",
        teacherId: teachers[3].id,
        seasonId: season2526.id,
      },
    }),
  ])

  // ── Enrollments ───────────────────────────────────────────────────────────

  const enrollments: { studentId: string; classId: string }[] = [
    // Jazz Débutants: students 01-05
    ...["student-01", "student-02", "student-03", "student-04", "student-05"].map((s) => ({
      studentId: s,
      classId: "class-jazz-1",
    })),
    // Jazz Intermédiaires: students 06-09
    ...["student-06", "student-07", "student-08", "student-09"].map((s) => ({
      studentId: s,
      classId: "class-jazz-2",
    })),
    // Hip-Hop: students 11-14
    ...["student-11", "student-12", "student-13", "student-14"].map((s) => ({
      studentId: s,
      classId: "class-hiphop",
    })),
    // Contemporain: students 07-10 (07 is in two classes)
    ...["student-07", "student-08", "student-09", "student-10"].map((s) => ({
      studentId: s,
      classId: "class-contemporary",
    })),
    // Classique: students 01,02,16,17,18
    ...["student-01", "student-02", "student-16", "student-17", "student-18"].map((s) => ({
      studentId: s,
      classId: "class-ballet",
    })),
    // Éveil: students 15,16,17,18
    ...["student-15", "student-16", "student-17", "student-18"].map((s) => ({
      studentId: s,
      classId: "class-eveil",
    })),
  ]

  await Promise.all(
    enrollments.map((e) =>
      prisma.studentClass.upsert({
        where: { studentId_classId: { studentId: e.studentId, classId: e.classId } },
        update: {},
        create: e,
      })
    )
  )

  // ── Shows ─────────────────────────────────────────────────────────────────

  const galas = await Promise.all([
    prisma.show.upsert({
      where: { id: "show-printemps" },
      update: {},
      create: {
        id: "show-printemps",
        name: "Gala de Printemps",
        date: new Date("2026-04-18"),
        seasonId: season2526.id,
        currentPosition: 2,
      },
    }),
    prisma.show.upsert({
      where: { id: "show-fin-annee" },
      update: {},
      create: {
        id: "show-fin-annee",
        name: "Spectacle de Fin d'Année",
        date: new Date("2026-06-20"),
        seasonId: season2526.id,
      },
    }),
  ])

  // ── Acts (Gala de Printemps) ──────────────────────────────────────────────

  const acts = await Promise.all([
    prisma.act.upsert({
      where: { id: "act-p-jazz1" },
      update: {},
      create: {
        id: "act-p-jazz1",
        name: "Feeling Good",
        classId: "class-jazz-1",
        showId: "show-printemps",
        priority: 2,
      },
    }),
    prisma.act.upsert({
      where: { id: "act-p-jazz2" },
      update: {},
      create: {
        id: "act-p-jazz2",
        name: "Chicago Medley",
        classId: "class-jazz-2",
        showId: "show-printemps",
        priority: 1,
        fixedPosition: 1,
      },
    }),
    prisma.act.upsert({
      where: { id: "act-p-hiphop" },
      update: {},
      create: {
        id: "act-p-hiphop",
        name: "Urban Flow",
        classId: "class-hiphop",
        showId: "show-printemps",
        priority: 3,
      },
    }),
    prisma.act.upsert({
      where: { id: "act-p-contem" },
      update: {},
      create: {
        id: "act-p-contem",
        name: "Fragments",
        classId: "class-contemporary",
        showId: "show-printemps",
        priority: 2,
      },
    }),
    prisma.act.upsert({
      where: { id: "act-p-ballet" },
      update: {},
      create: {
        id: "act-p-ballet",
        name: "Lac des Cygnes (extrait)",
        classId: "class-ballet",
        showId: "show-printemps",
        fixedPosition: 5,
      },
    }),
  ])

  // ── ActPositions (saved order for Gala de Printemps) ─────────────────────

  const positions = [
    { actId: "act-p-jazz2", position: 1 },
    { actId: "act-p-jazz1", position: 2 },
    { actId: "act-p-hiphop", position: 3 },
    { actId: "act-p-contem", position: 4 },
    { actId: "act-p-ballet", position: 5 },
  ]

  await Promise.all(
    positions.map((p) =>
      prisma.actPosition.upsert({
        where: { showId_actId: { showId: "show-printemps", actId: p.actId } },
        update: { position: p.position },
        create: { showId: "show-printemps", actId: p.actId, position: p.position },
      })
    )
  )

  // ── Acts (Spectacle de Fin d'Année) ───────────────────────────────────────

  await Promise.all([
    prisma.act.upsert({
      where: { id: "act-f-jazz1" },
      update: {},
      create: {
        id: "act-f-jazz1",
        name: "Cabaret",
        classId: "class-jazz-1",
        showId: "show-fin-annee",
        priority: 1,
      },
    }),
    prisma.act.upsert({
      where: { id: "act-f-jazz2" },
      update: {},
      create: {
        id: "act-f-jazz2",
        name: "All That Jazz",
        classId: "class-jazz-2",
        showId: "show-fin-annee",
        priority: 1,
        fixedPosition: 1,
      },
    }),
    prisma.act.upsert({
      where: { id: "act-f-hiphop" },
      update: {},
      create: {
        id: "act-f-hiphop",
        name: "Battle Royale",
        classId: "class-hiphop",
        showId: "show-fin-annee",
        priority: 2,
      },
    }),
    prisma.act.upsert({
      where: { id: "act-f-contem" },
      update: {},
      create: {
        id: "act-f-contem",
        name: "Silences",
        classId: "class-contemporary",
        showId: "show-fin-annee",
      },
    }),
    prisma.act.upsert({
      where: { id: "act-f-ballet" },
      update: {},
      create: {
        id: "act-f-ballet",
        name: "Belle au Bois Dormant (extrait)",
        classId: "class-ballet",
        showId: "show-fin-annee",
        fixedPosition: 7,
      },
    }),
    prisma.act.upsert({
      where: { id: "act-f-eveil" },
      update: {},
      create: {
        id: "act-f-eveil",
        name: "Les Petites Étoiles",
        classId: "class-eveil",
        showId: "show-fin-annee",
        fixedPosition: 2,
      },
    }),
  ])

  // ── ShowParticipations ────────────────────────────────────────────────────

  // Gala de Printemps: students from jazz-1, jazz-2, hiphop, contemporary, ballet
  const galaPrintempsStudents = [
    "student-01", "student-02", "student-03", "student-04", "student-05", // jazz-1
    "student-06", "student-07", "student-08", "student-09",               // jazz-2
    "student-11", "student-12", "student-13", "student-14",               // hiphop
    "student-10",                                                          // contemporary only
    "student-16", "student-17", "student-18",                             // ballet (not already listed)
  ]

  await Promise.all(
    galaPrintempsStudents.map((s) =>
      prisma.showParticipation.upsert({
        where: { showId_studentId: { showId: "show-printemps", studentId: s } },
        update: {},
        create: { showId: "show-printemps", studentId: s },
      })
    )
  )

  // Spectacle de Fin d'Année: all students
  await Promise.all(
    studentData.map((s) =>
      prisma.showParticipation.upsert({
        where: { showId_studentId: { showId: "show-fin-annee", studentId: s.id } },
        update: {},
        create: { showId: "show-fin-annee", studentId: s.id },
      })
    )
  )

  // ── Admin user ────────────────────────────────────────────────────────────

  await prisma.user.upsert({
    where: { username: "admin-test" },
    update: {},
    create: {
      username: "admin-test",
      hashedPassword: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
    },
  })

  console.log("Done.")
  console.log("")
  console.log("  Seasons   : 2024-2025 (inactive), 2025-2026 (active)")
  console.log("  Teachers  : 4")
  console.log("  Students  : 18")
  console.log("  Classes   : 6 (Jazz x2, Hip-Hop, Contemporain, Classique, Éveil)")
  console.log("  Shows     : Gala de Printemps (order saved), Spectacle de Fin d'Année")
  console.log("  Admin     : admin-test / admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
