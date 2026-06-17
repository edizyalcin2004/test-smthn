// ProScreen — Pryce Pro detail / upsell. Presentation only (mock copy).
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, font, money } from '../theme/tokens';
import { Screen, Card, Header, Pill, PrimaryButton } from '../components/ui';
import { Icon, Spark } from '../components/icons';
import Food from '../components/Food';

const mascot = require('../../assets/mascot.png');

const USER_POINTS = 2540;

const FEATS = [
  { icon: 'spark', title: 'Sınırsız karşılaştırma', desc: 'Dilediğin kadar sepet karşılaştır, her zaman.', food: 'receipt' },
  { icon: 'bolt', title: 'Özel indirim uyarıları', desc: 'En iyi kodlara ve fiyat düşüşlerine erken eriş.', food: 'discount-tag' },
  { icon: 'chart', title: 'Akıllı bütçe önerileri', desc: 'Harcamanı analiz et, tasarrufu artır.', food: null },
];

export default function ProScreen({ navigation }) {
  return (
    <Screen>
      <Header title="Pryce Pro" sub="Premium avantajlar. Daha çok tasarruf." back onBack={() => navigation.goBack()} />

      {/* hero */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <LinearGradient colors={['#0C2C5C', '#061B3A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
          <Spark s={16} style={{ position: 'absolute', left: '56%', top: '16%' }} />
          <Spark s={11} o={0.7} style={{ position: 'absolute', left: '80%', top: '44%' }} />
          <Spark s={10} o={0.6} style={{ position: 'absolute', left: '64%', top: '70%' }} />
          <Image source={mascot} style={s.heroMascot} resizeMode="contain" />
          <View style={{ maxWidth: '66%' }}>
            <Pill bg="rgba(255,200,87,0.18)" fg={T.amber}>
              <Icon name="crown" s={13} c={T.amber} />
              <Text style={{ color: T.amber, fontFamily: font.extrabold, fontSize: 11 }}>PRO</Text>
            </Pill>
            <Text style={s.heroTitle}>Daha akıllı al, daha çok kazan</Text>
            <Text style={s.heroSub}>{USER_POINTS.toLocaleString('tr-TR')} puanınla başla.</Text>
          </View>
        </LinearGradient>
      </View>

      {/* features */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 12 }}>
        {FEATS.map((f, i) => (
          <Card key={i} style={s.feat}>
            <View style={s.featIcon}>
              {f.food ? <Food name={f.food} s={32} /> : <Icon name={f.icon} s={24} c={T.blue} />}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.featTitle}>{f.title}</Text>
              <Text style={s.featDesc}>{f.desc}</Text>
            </View>
          </Card>
        ))}
      </View>

      {/* price + CTA */}
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <View style={s.priceRow}>
          <Text style={s.price}>{money(49)}</Text>
          <Text style={s.priceUnit}> / ay</Text>
        </View>
        <PrimaryButton bg={T.blue}>Pryce Pro'ya yükselt</PrimaryButton>
        <Text style={s.fine}>İstediğin zaman iptal et. Gizli ücret yok.</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 22, paddingHorizontal: 20, paddingVertical: 22, overflow: 'hidden' },
  heroMascot: { position: 'absolute', right: -12, bottom: -16, width: 128, height: 128 },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.4, marginTop: 12, lineHeight: 26 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: font.medium, marginTop: 7, lineHeight: 19 },

  feat: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: T.blueSoft, alignItems: 'center', justifyContent: 'center' },
  featTitle: { fontSize: 15, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.2 },
  featDesc: { fontSize: 12.5, color: T.sub, marginTop: 3, lineHeight: 18, fontFamily: font.medium },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 14 },
  price: { fontSize: 30, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.9 },
  priceUnit: { fontSize: 15, fontFamily: font.bold, color: T.faint },
  fine: { textAlign: 'center', marginTop: 12, fontSize: 12, color: T.faint, fontFamily: font.semibold },
});
