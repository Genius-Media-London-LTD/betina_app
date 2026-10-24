import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import BackButton from '../src/components/BackButton';
import BETinaAvatar from '../src/components/BETinaAvatar';
import GlowButton from '../src/components/GlowButton';
import { Headline, Meta, Sticker } from '../src/components/Urban';
import { useI18n } from '../src/lib/i18n';
import { fetchNewsArticle, fetchNewsFeed, NewsArticle, NewsCard, readingMinutes, timeAgo } from '../src/lib/news';
import { cleanFeedText, fetchNewsApi } from '../src/lib/sports';
import { safeGenius2PlayCanonical } from '../src/lib/genius2playCanonical';
import { Colors, Fonts, withAlpha } from '../src/theme';

const { height: H } = Dimensions.get('window');

type Shown = NewsArticle & { canonical?: string };

/** Older links (push notifications, chat) still point at a publisher URL. */
async function loadLegacy(url: string, title?: string, image?: string): Promise<Shown | null> {
  const d = await fetchNewsApi('article', `url=${encodeURIComponent(url)}`);
  const body = (Array.isArray(d?.paragraphs) ? d.paragraphs : [])
    .filter((p: unknown) => typeof p === 'string').map((p: string) => cleanFeedText(p)).filter(Boolean);
  if (d?.error || (!body.length && !d?.title && !title)) return null;
  return {
    id: 0,
    kicker: 'NEWS',
    headline: cleanFeedText(d?.title ?? title ?? ''),
    teaser: cleanFeedText(typeof d?.description === 'string' ? d.description : ''),
    body,
    take: null,
    image: (typeof d?.image === 'string' && d.image) || image || null,
    published_at: '',
    sport: null,
    source_name: typeof d?.source === 'string' ? d.source : '',
    source_url: typeof d?.url === 'string' ? d.url : url,
    canonical: safeGenius2PlayCanonical(d?.canonical),
  };
}

export default function ArticleScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, url, title, image } = useLocalSearchParams<{ id?: string; url?: string; title?: string; image?: string }>();
  const [article, setArticle] = useState<Shown | null>(null);
  const [more, setMore] = useState<NewsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    const load = id ? fetchNewsArticle(Number(id), lang) : url ? loadLegacy(url, title, image) : Promise.resolve(null);
    load
      .then((a) => {
        if (!alive) return;
        if (!a) setError(true);
        setArticle(a);
        if (a && id) {
          fetchNewsFeed({ lang, sport: a.sport, limit: 6 })
            .then((list) => alive && setMore(list.filter((c) => c.id !== a.id).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id, url, lang]);

  const date = article?.published_at
    ? new Date(article.published_at).toLocaleString(lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.root}>
      <View style={[styles.back, { top: insets.top + 10 }]}>
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/live'))} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      )}

      {!loading && (error || !article) && (
        <View style={styles.center}>
          <Headline text={t.articleError} size={34} accent="last" style={{ textAlign: 'center' }} />
          <GlowButton label={t.articleBack} variant="ghost" onPress={() => router.back()} />
        </View>
      )}

      {!loading && article && (
        <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1 }}>
          {article.canonical ? (
            <Head>
              <link rel="canonical" href={article.canonical} />
            </Head>
          ) : null}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>
            {/* Hero */}
            <View style={styles.hero}>
              {article.image ? (
                <Image source={{ uri: article.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.card }]} />
              )}
              <LinearGradient
                colors={[withAlpha(Colors.black, 0.35), withAlpha(Colors.black, 0), withAlpha(Colors.black, 0.6), Colors.black]}
                locations={[0, 0.25, 0.7, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            </View>

            {/* Headline block */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.head}>
              <Sticker text={article.kicker} />
              <Headline text={article.headline} size={40} accent="first" />
              {!!article.teaser && <Text style={styles.teaser}>{article.teaser}</Text>}
              <View style={styles.metaRow}>
                <Meta color={Colors.primary}>BETINA NEWS</Meta>
                {!!date && <Meta>{`· ${date}`}</Meta>}
                {article.body.length > 0 && <Meta>{`· ${readingMinutes(article.body)} MIN`}</Meta>}
              </View>
            </Animated.View>
            <View style={styles.rule} />

            {/* Body */}
            <View style={styles.body}>
              {article.body.map((p, i) => (
                <Text key={i} style={i === 0 ? styles.lead : styles.para}>{p}</Text>
              ))}
            </View>

            {/* BETina's take */}
            {!!article.take && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.take}>
                <View style={styles.takeHead}>
                  <BETinaAvatar size={44} />
                  <Headline text={t.newsTake} size={26} accent="last" />
                </View>
                <Text style={styles.takeText}>{article.take}</Text>
                <GlowButton
                  label={t.articleAsk}
                  onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/chat'); }}
                />
              </Animated.View>
            )}

            {/* Source credit */}
            {!!article.source_name && (
              <Pressable onPress={() => article.source_url && WebBrowser.openBrowserAsync(article.source_url)} style={styles.source}>
                <Meta>{`${t.newsSource}: ${article.source_name} ↗`}</Meta>
              </Pressable>
            )}

            {/* More news */}
            {more.length > 0 && (
              <View style={styles.more}>
                <Headline text={t.newsMore} size={30} accent="last" />
                {more.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/article', params: { id: String(c.id) } }); }}
                    style={({ pressed }) => [styles.moreRow, pressed && { backgroundColor: Colors.card }]}
                  >
                    <View style={{ flex: 1, gap: 5 }}>
                      <Meta color={Colors.primary}>{c.kicker}</Meta>
                      <Text style={styles.moreTitle} numberOfLines={3}>{c.headline.toUpperCase()}</Text>
                      <Meta>{timeAgo(c.published_at, t)}</Meta>
                    </View>
                    {c.image && <Image source={{ uri: c.image }} style={styles.moreThumb} resizeMode="cover" />}
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  back: { position: 'absolute', left: 16, zIndex: 10, backgroundColor: Colors.black },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 },

  hero: { height: Math.round(H * 0.42), backgroundColor: Colors.card },
  head: { paddingHorizontal: 16, marginTop: -40, gap: 12 },
  teaser: { color: Colors.white, fontSize: 19, lineHeight: 25, fontFamily: Fonts.labelSemi },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rule: { height: 3, width: 56, backgroundColor: Colors.primary, marginHorizontal: 16, marginTop: 20, marginBottom: 6 },

  body: { paddingHorizontal: 16, paddingTop: 14, gap: 18 },
  lead: { color: Colors.white, fontSize: 18, lineHeight: 29, fontFamily: Fonts.semibold },
  para: { color: Colors.accentLight, fontSize: 17, lineHeight: 28, fontFamily: Fonts.regular },

  take: {
    margin: 16, marginTop: 32, padding: 16, gap: 14,
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.surface,
  },
  takeHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  takeText: { color: Colors.white, fontSize: 18, lineHeight: 26, fontFamily: Fonts.medium },

  source: { paddingHorizontal: 16, paddingVertical: 10 },

  more: { paddingHorizontal: 16, paddingTop: 24, gap: 4 },
  moreRow: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.line },
  moreTitle: { color: Colors.white, fontSize: 18, lineHeight: 20, fontFamily: Fonts.label },
  moreThumb: { width: 84, height: 84 },
});
