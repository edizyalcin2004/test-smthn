// PrivacyScreen — the in-app privacy notice. Text lives in content/privacy.js
// so it can be reviewed (and pinned by tests) separately from layout.
import { View, Text, StyleSheet } from 'react-native';
import { T, font } from '../theme/tokens';
import { Screen, Card, Header } from '../components/ui';
import { SECTIONS, CONTROLLER, UPDATED } from '../content/privacy';

export default function PrivacyScreen({ navigation }) {
  return (
    <Screen>
      <Header title="Gizlilik" sub={`Son güncelleme: ${UPDATED}`} back onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 12 }}>
        {SECTIONS.map((sec) => (
          <Card key={sec.title} style={{ gap: 8 }}>
            <Text style={s.title}>{sec.title}</Text>
            {sec.body.map((p, i) => <Text key={i} style={s.body}>{p}</Text>)}
          </Card>
        ))}
        <Card style={{ gap: 8 }}>
          <Text style={s.title}>Veri sorumlusu ve iletişim</Text>
          {CONTROLLER ? (
            <>
              <Text style={s.body}>{CONTROLLER.name}</Text>
              <Text style={s.body}>{CONTROLLER.contact}</Text>
            </>
          ) : (
            <Text style={s.body}>Pryce şu an test aşamasında. Veri sorumlusu ve iletişim bilgisi genel yayından önce buraya eklenecek.</Text>
          )}
        </Card>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 15, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.2 },
  body: { fontSize: 13, color: T.sub, lineHeight: 19, fontFamily: font.medium },
});
