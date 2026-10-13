<!--
AboutView.vue

Statische Info Seite der Applikation.
Beschreibt den Kontext und die Kernfunktionen der Plattform
(Artikel erstellen, Kommentare, Likes, Abonnements).
Enthält keine reaktive Logik.
-->

<template>
  <main class="max-w-4xl mx-auto px-6 py-12">
    <section class="rounded-2xl border border-gray-800 bg-gray-900/60 p-8 shadow-lg">

      <h1 class="text-4xl font-bold text-white mb-4">
        About the Platform
      </h1>

      <p class="text-gray-300 leading-7 mb-10">
        Welcome to our article platform. A modern web application developed as
        part of the <span class="font-semibold text-white">Web Engineering II</span>
        course. The goal of this project is to provide a clean and intuitive
        environment for creating, sharing, and discovering articles.
      </p>

      <div class="grid gap-6 md:grid-cols-2">

        <!-- Create Content -->
        <div class="rounded-xl bg-gray-800/70 p-6">
          <div class="mb-3 flex items-center gap-2">
            <PenLine class="h-5 w-5 text-indigo-400" />
            <h2 class="text-lg font-semibold text-white">Create Content</h2>
          </div>
          <p class="text-gray-400">
            Write and publish your own articles with an easy to use editor and
            share your ideas with the community.
          </p>
        </div>

        <!-- Join Discussions -->
        <div class="rounded-xl bg-gray-800/70 p-6">
          <div class="mb-3 flex items-center gap-2">
            <MessageCircle class="h-5 w-5 text-indigo-400" />
            <h2 class="text-lg font-semibold text-white">Join Discussions</h2>
          </div>
          <p class="text-gray-400">
            Comment on articles, exchange ideas, and interact with other users
            through meaningful discussions.
          </p>
        </div>

        <!-- Like Articles -->
        <div class="rounded-xl bg-gray-800/70 p-6">
          <div class="mb-3 flex items-center gap-2">
            <Heart class="h-5 w-5 text-indigo-400" />
            <h2 class="text-lg font-semibold text-white">Like Articles</h2>
          </div>
          <p class="text-gray-400">
            Like articles to show appreciation and quickly find the content you
            enjoy most later.
          </p>
        </div>

        <!-- Follow Authors -->
        <div class="rounded-xl bg-gray-800/70 p-6">
          <div class="mb-3 flex items-center gap-2">
            <UserPlus class="h-5 w-5 text-indigo-400" />
            <h2 class="text-lg font-semibold text-white">Follow Authors</h2>
          </div>
          <p class="text-gray-400">
            Stay connected with your favorite authors and keep up with their
            latest publications.
          </p>
        </div>

      </div>

      <div class="mt-10 border-t border-gray-800 pt-6">
        <p class="text-sm text-gray-500">
          This application was developed as part of the Web Engineering II
          course and demonstrates modern full Stack development using Vue,
          Tailwind CSS, NestJS, Prisma, and SQLite.
        </p>
      </div>

    </section>
  </main>
</template>

<script setup lang="ts">
import {
  PenLine,
  MessageCircle,
  Heart,
  UserPlus,
} from "lucide-vue-next";
</script>