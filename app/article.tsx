import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useI18n } from '../src/lib/i18n';
import { safeGenius2PlayCanonical } from '../src/lib/genius2playCanonical';
import { Colors, Fonts, Spacing, Typography } from '../src/theme';

const { width: W, height: H } = Dimensions.get('window');
const API = 'https://intelligence.geniusbet.com';

type Article = {
  title: string;
  image: string;
  description: string;
  paragraphs: string[];
  source: string;
  url: string;
  canonical?: string;
};

function readingTime(paragraphs?: string[]) {
  if (!paragraphs?.length) return 1;
  const words = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(rssDate: string) {
  try {
    return new Date(rssDate).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return rssDate; }
}

export default function ArticleScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { url, title: paramTitle, pubDate, image: paramImage } = useLocalSearchParams<{
    url: string; title?: string; pubDate?: string; image?: string;
  }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    fetch(`${API}/api/sports/article?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => {
        // The scraper can fail (e.g. Google News redirect links) and return an
        // error object or partial data. Normalise, and only error out if there
        // is nothing at all to show.
        const paragraphs = Array.isArray(d?.paragraphs) ? d.paragraphs.filter((p: unknown) => typeof p === 'string') : [];
        const hasContent = !d?.error && (paragraphs.length > 0 || d?.title || paramTitle);
        if (!hasContent) {
          setError(true);
        } else {
          setArticle({
            title: d?.title ?? paramTitle ?? '',
            image: typeof d?.image === 'string' ? d.image : '',
            description: typeof d?.description === 'string' ? d.description : '',
            paragraphs,
            source: typeof d?.source === 'string' ? d.source : '',
            url: typeof d?.url === 'string' ? d.url : url,
            canonical: safeGenius2PlayCanonical(d?.canonical),
          });
        }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [url]);

  return (
    <View style={styles.root}>
      {/* Back button — always visible */}
      <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 12 }]}>
        <Text style={styles.backIcon}>←</Text>
      </Pressable>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>{t.articleLoading}</Text>
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>📡</Text>
          <Text style={styles.errorText}>{t.articleError}</Text>
          <Pressable onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryLabel}>← {t.articleBack}</Text>
          </Pressable>
        </View>
      )}

      {article && !loading && (
        <>
          {article.canonical ? (
            <Head>
              <link rel="canonical" href={article.canonical} />
            </Head>
          ) : null}
          <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>

            {/* ── HERO ── */}
            <View style={styles.heroWrap}>
              {(article.image || paramImage) ? (
                <Image source={{ uri: article.image || paramImage }} style={styles.heroImage} resizeMode="cover" />
              ) : (
                <View style={[styles.heroImage, styles.heroFallback]}>
                  <Text style={{ fontSize: 72 }}>📰</Text>
                </View>
              )}
              {/* Deep gradient so text is readable */}
              <LinearGradient
                colors={['transparent', 'rgba(8,8,18,0.5)', Colors.background]}
                locations={[0.3, 0.7, 1]}
                style={styles.heroGradient}
              />
              {/* Source pill over hero */}
              <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.sourcePill}>
                <Text style={styles.sourcePillText}>📡 {article.source || 'News'}</Text>
              </Animated.View>
            </View>

            {/* ── HEADER BLOCK ── */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.headerBlock}>
              {/* Meta row */}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {pubDate ? formatDate(pubDate) : 'Latest'}
                </Text>
                <View style={styles.metaDot} />
                <Text style={styles.metaText}>
                  {readingTime(article.paragraphs)} min read
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{article.title || paramTitle || 'Article'}</Text>

              {/* Lead / description */}
              {article.description ? (
                <Text style={styles.lead}>{article.description}</Text>
              ) : null}
            </Animated.View>

            {/* ── DIVIDER ── */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerIcon}>⚡</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* ── BODY ── */}
            <View style={styles.body}>
              {article.paragraphs.length === 0 && (
                <>
                  {article.description ? null : (
                    <Text style={styles.para}>{t.articleError}</Text>
                  )}
                  <Pressable onPress={() => WebBrowser.openBrowserAsync(article.url)} style={styles.openBtn}>
                    <Text style={styles.openLabel}>Read full article ↗</Text>
                  </Pressable>
                </>
              )}
              {article.paragraphs.map((para, i) => {
                // Every ~4 paragraphs: pull-quote style for a sentence
                const isPullQuote = i > 0 && i % 4 === 0 && para.length > 80;
                return isPullQuote ? (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.delay(Math.min(i * 40, 400)).duration(400)}
                    style={styles.pullQuoteWrap}
                  >
                    <LinearGradient
                      colors={['rgba(184,233,38,0.06)', 'rgba(120,80,255,0.06)']}
                      style={styles.pullQuote}
                    >
                      <View style={styles.pullQuoteBar} />
                      <Text style={styles.pullQuoteText}>
                        "{para.split('.')[0]}."
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                ) : (
                  <Animated.Text
                    key={i}
                    entering={FadeInDown.delay(Math.min(i * 30, 400)).duration(400)}
                    style={styles.para}
                  >
                    {para}
                  </Animated.Text>
                );
              })}
            </View>

            {/* ── BETINA CTA ── */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.ctaWrap}>
              <LinearGradient
                colors={['rgba(184,233,38,0.1)', 'rgba(120,80,255,0.12)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.ctaCard}
              >
                <View style={styles.ctaLeft}>
                  <Text style={styles.ctaEmoji}>⚡</Text>
                  <View>
                    <Text style={styles.ctaTitle}>Ask BETina about this</Text>
                    <Text style={styles.ctaDesc}>Analysis, predictions & more</Text>
                  </View>
                </View>
                <Pressable onPress={() => router.push('/(tabs)/chat')} style={styles.ctaBtn}>
                  <Text style={styles.ctaBtnLabel}>Chat →</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>

          </ScrollView>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },

  backBtn: {
    position: 'absolute', left: Spacing.lg, zIndex: 100,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(8,8,18,0.75)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#FFF', fontSize: 22, fontFamily: Fonts.bold, marginTop: -1 },

  loadingText: { color: Colors.textSecondary, fontFamily: Fonts.medium, fontSize: Typography.sm, marginTop: 8 },
  errorText: { color: Colors.textSecondary, fontFamily: Fonts.medium, fontSize: Typography.base, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  retryLabel: { color: '#FFF', fontFamily: Fonts.semibold, fontSize: Typography.sm },

  /* Hero */
  heroWrap: { width: W, height: H * 0.45, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroFallback: { backgroundColor: '#111124', alignItems: 'center', justifyContent: 'center' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%' },
  sourcePill: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(8,8,18,0.75)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
  },
  sourcePillText: { color: '#FFF', fontSize: Typography.xs, fontFamily: Fonts.semibold },

  /* Header block */
  headerBlock: { paddingHorizontal: Spacing.lg, paddingTop: 12, gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textSecondary },
  title: {
    color: '#FFF', fontSize: Typography.xl + 3,
    fontFamily: Fonts.bold, lineHeight: 36, letterSpacing: -0.3,
  },
  lead: {
    color: 'rgba(255,255,255,0.7)', fontSize: Typography.base + 1,
    fontFamily: Fonts.medium, lineHeight: 26, fontStyle: 'italic',
  },

  /* Divider */
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.lg, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerIcon: { fontSize: 14, color: Colors.primary },

  /* Body */
  body: { paddingHorizontal: Spacing.lg, gap: 16 },
  openBtn: {
    alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  openLabel: { color: '#FFF', fontFamily: Fonts.semibold, fontSize: Typography.sm },
  para: {
    color: 'rgba(255,255,255,0.82)', fontSize: Typography.sm + 2,
    fontFamily: Fonts.regular, lineHeight: 28,
  },
  pullQuoteWrap: { marginVertical: 4 },
  pullQuote: {
    flexDirection: 'row', borderRadius: 12, overflow: 'hidden',
    padding: 16, gap: 12, alignItems: 'flex-start',
  },
  pullQuoteBar: { width: 3, borderRadius: 2, backgroundColor: Colors.primary, alignSelf: 'stretch' },
  pullQuoteText: {
    flex: 1, color: 'rgba(255,255,255,0.9)', fontSize: Typography.base + 1,
    fontFamily: Fonts.semibold, lineHeight: 26, fontStyle: 'italic',
  },

  /* BETina CTA */
  ctaWrap: { margin: Spacing.lg, marginTop: 24 },
  ctaCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(184,233,38,0.2)',
  },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  ctaEmoji: { fontSize: 28 },
  ctaTitle: { color: '#FFF', fontFamily: Fonts.bold, fontSize: Typography.sm + 1 },
  ctaDesc: { color: Colors.textSecondary, fontFamily: Fonts.medium, fontSize: Typography.xs + 1, marginTop: 2 },
  ctaBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  ctaBtnLabel: { color: '#000', fontFamily: Fonts.bold, fontSize: Typography.sm },
});
