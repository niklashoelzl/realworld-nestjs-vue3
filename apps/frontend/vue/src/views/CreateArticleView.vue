<!--
CreateArticleView.vue

Formular zum Erstellen eines neuen Artikels.
Felder: Titel, Beschreibung, Artikeltext und Tags (kommasepariert).

Der Publish Button ist nur aktiv, wenn Titel, Beschreibung und Text
nicht leer sind. Nach erfolgreichem Erstellen wird der Nutzer zur
Detailansicht des neuen Artikels weitergeleitet.
Fehler werden im Composable gehalten und im Template angezeigt.
-->

<template>
    <div class="min-h-screen bg-gray-900 py-8">
        <div class="max-w-3xl mx-auto px-4">
            <h1 class="text-2xl font-bold text-white mb-6">New Article</h1>
            <div class="bg-gray-800 rounded-lg border border-gray-700 p-8 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-100 mb-1">Title</label>
                    <input v-model="form.title" type="text" placeholder="Article Title"
                        class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                        :disabled="loading" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-100 mb-1">Description</label>
                    <input v-model="form.description" type="text" placeholder="What's this article about?"
                        class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                        :disabled="loading" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-100 mb-1">Article Content</label>
                    <textarea v-model="form.body" rows="10" placeholder="Write your article"
                        class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500 resize-none"
                        :disabled="loading"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-100 mb-1">Tags</label>
                    <input v-model="tagsInput" type="text"
                        placeholder="Enter tags separated by commas (e.g. vue, Typescript)"
                        class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                        :disabled="loading" />
                </div>

                <!-- Error Message -->
                <div v-if="error" class="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                    <p class="text-sm text-red-400">{{ error }}</p>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3">
                    <button @click="handleSubmit" :disabled="loading || !isValid"
                        class="flex items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
                        {{ loading ? 'Publishing...' : 'Publish Article' }}
                    </button>
                    <RouterLink to="/"
                        class="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600">
                        Cancel
                    </RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useArticle } from '@/composables/use-article';

const router = useRouter();
const { createArticle, loading, error } = useArticle();

const form = ref({
    title: '',
    description: '',
    body: '',
});

/** Tags als kommaseparierter String; wird vor dem Absenden aufgeteilt */
const tagsInput = ref('');

/** Gibt an, ob das Formular abgeschickt werden kann */
const isValid = computed(() => {
    return form.value.title.trim() !== '' && form.value.description.trim() !== '' && form.value.body.trim() !== '';
});

/**
 * Verarbeitet das Absenden des Formulars.
 * Parst den Tag String und übergibt die Daten an das Composable.
 * Nach Erfolg wird zur Artikeldetailseite navigiert.
 */
async function handleSubmit() {
    if (!isValid.value) return;

    const tagList = tagsInput.value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '');

    try {
        const created = await createArticle({
            title: form.value.title.trim(),
            description: form.value.description.trim(),
            body: form.value.body.trim(),
            tagList,
        });

        await router.push(`/articles/${created.slug}`);
    } catch {
        // Fehler wird bereits in error.value gehalten und im Template angezeigt
    }
}
</script>
