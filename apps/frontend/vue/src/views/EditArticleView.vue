<!--
EditArticleView.vue

Formular zum Bearbeiten eines bestehenden Artikels.
Lädt den Artikel anhand des URL Slugs und befüllt das Formular
mit den vorhandenen Werten.

Der Speichern Button ist nur aktiv, wenn Titel, Beschreibung und Text
nicht leer sind. Nach erfolgreichem Speichern wird der Nutzer zur
Detailansicht des Artikels weitergeleitet.
Fehler werden im Composable gehalten und im Template angezeigt.
-->

<template>
    <div class="min-h-screen bg-gray-900 py-8">
        <div class="max-w-3xl mx-auto px-4">
            <h1 class="text-2xl font-bold text-white mb-6">Edit Article</h1>

            <!-- Loading State -->
            <div v-if="fetchLoading && !article" class="text-center py-8 text-gray-500">
                Loading article...
            </div>
            <div v-else class="bg-gray-800 rounded-lg border border-gray-700 p-8 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-100 mb-1">Title</label>
                    <input v-model="form.title" type="text"
                        class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                        :disabled="loading" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-100 mb-1">Description</label>
                    <input v-model="form.description" type="text"
                        class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                        :disabled="loading" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-100 mb-1">Body</label>
                    <textarea v-model="form.body" rows="10"
                        class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500 resize-none"
                        :disabled="loading"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-100 mb-1">Tags</label>
                    <input v-model="tagsInput" type="text" placeholder="Enter tags separated by commas (e.g. vue, Typescript)"
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
                        {{ loading ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <RouterLink :to="`/articles/${slug}`"
                        class="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600">
                        Cancel
                    </RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useArticle } from '@/composables/use-article';

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;

const { article, loading, error, fetchArticle, updateArticle } = useArticle();

/** Separater Ladezustand für den initialen Artikel Fetch (vor dem Formular Render) */
const fetchLoading = ref(true);
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
 * Lädt den Artikel und befüllt das Formular mit den vorhandenen Werten.
 * `fetchLoading` wird nach Abschluss zurückgesetzt, unabhängig vom Ergebnis.
 */
onMounted(async () => {
    try {
        await fetchArticle(slug);

        if (article.value) {
            form.value = {
                title: article.value.title,
                description: article.value.description,
                body: article.value.body,
            };
            tagsInput.value = article.value.tagList.join(', ');
        }
    } finally {
        fetchLoading.value = false;
    }
});

/**
 * Verarbeitet das Absenden des Formulars.
 * Parst den Tag String und übergibt die Daten an das Composable.
 * Nach Erfolg wird zur Artikeldetailseite navigiert.
 */
async function handleSubmit() {
    if (!isValid.value) return;

    try {
        await updateArticle(slug, {
            title: form.value.title.trim(),
            description: form.value.description.trim(),
            body: form.value.body.trim(),
            tagList: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
        });

        await router.push(`/articles/${slug}`);
    } catch {
        // Fehler wird bereits in error.value gehalten und im Template angezeigt
    }
}
</script>
