# Annonces de maintenance : Lot 0 et bascule multi-écoles (arabe et français)

> À adapter : remplacer `<…>`. Envoyer **48 heures avant** puis le jour même,
> sur les canaux habituels de l'école (groupe des parents, groupe du
> personnel). Ces annonces ne contiennent **aucun identifiant ni mot de passe**.
> Les identifiants se remettent individuellement (`identifiants.md`).
> Procédures : `docs/runbooks/LOT0-DEPLOIEMENT.md`, `docs/runbooks/MIGRATION-BASCULE.md`.

---

## 1. Lot 0 (correctif de sécurité)

Décision retenue (`release/lot0`, D53) : **chacun garde son mot de passe**.
Il doit le changer à la première connexion. Si le runbook est finalement
lancé avec remplacement des mots de passe (`--rotate-passwords=all`),
utiliser la variante B.

### العربية (الإعلان)
> **إعلان: صيانة منظومة «<اسم المدرسة>»**
>
> السلام عليكم ورحمة الله،
> في إطار تعزيز حماية معطيات أبنائنا والعاملين، ستخضع المنظومة لعملية صيانة يوم <اليوم والتاريخ> من الساعة <ساعة البداية> إلى الساعة <ساعة النهاية> تقريباً. خلال هذه المدة، قد يتعذر الدخول إلى المنظومة.
>
> **بعد الصيانة:**
> - ادخلوا باسم المستخدم وكلمة المرور المعتادين؛
> - سيُطلب منكم مباشرة اختيار كلمة مرور جديدة (8 أحرف على الأقل): اختاروا كلمة خاصة بكم ولا تطلعوا عليها أحداً؛
> - إذا تعذر عليكم الدخول، اتصلوا بالإدارة: <contact>.
>
> لن تطلب منكم الإدارة أبداً كلمة مروركم عبر الهاتف أو الرسائل.
> شكراً على تفهمكم.

**Variante B (mots de passe remplacés)**. Remplacer le bloc « بعد الصيانة » par :
> - أصبحت كلمات المرور القديمة غير صالحة؛
> - ستتسلمون شخصياً من إدارة المدرسة كلمة مرور مؤقتة جديدة، وسيُطلب منكم تغييرها عند أول دخول؛
> - لن تُرسل أي كلمة مرور في المجموعات.

### Français (annonce)
> **Maintenance de l'application de « <nom de l'école> »**
>
> Bonjour,
> Pour mieux protéger les données des élèves et du personnel, l'application
> sera en maintenance le <jour et date>, de <heure de début> à <heure de fin>
> environ. Elle pourra être inaccessible pendant ce temps.
>
> **Après la maintenance :**
> - connectez-vous avec votre identifiant et votre mot de passe habituels ;
> - l'application vous demandera aussitôt de choisir un nouveau mot de passe
>   (8 caractères au moins) : choisissez-en un qui vous est propre et ne le
>   communiquez à personne ;
> - en cas de difficulté, contactez l'administration : <contact>.
>
> L'école ne vous demandera jamais votre mot de passe par téléphone ou par message.

**Variante B**. Remplacer le bloc « Après la maintenance » par :
> - les anciens mots de passe ne fonctionnent plus ;
> - l'école vous remettra personnellement un nouveau mot de passe temporaire, à
>   changer à la première connexion ;
> - aucun mot de passe ne sera envoyé dans un groupe.

### Message de fin de maintenance (les deux variantes)
- العربية : « انتهت الصيانة والحمد لله. يمكنكم الدخول الآن إلى المنظومة. تذكير: سيُطلب منكم اختيار كلمة مرور جديدة عند أول دخول. »
- Français : « La maintenance est terminée. Vous pouvez vous reconnecter. Rappel :
  un nouveau mot de passe vous sera demandé à la première connexion. »

---

## 2. Bascule multi-écoles

Ce que vivent les utilisateurs :
- les sessions ouvertes sont fermées et il faut se reconnecter, avec le même
  identifiant et le même mot de passe ;
- après la connexion, l'application ouvre directement la dernière école ;
- seules les personnes inscrites dans plusieurs écoles voient un sélecteur
  d'école ;
- les enseignants ne voient plus les salaires ni les CIN dans la liste du
  personnel : c'est voulu.

### العربية
> **إعلان: تحديث منظومة «<اسم المدرسة>»**
>
> السلام عليكم،
> سيتم تحديث المنظومة يوم <اليوم والتاريخ> من الساعة <ساعة البداية> إلى الساعة <ساعة النهاية> تقريباً، ويتعذر الدخول خلال هذه المدة.
>
> **بعد التحديث:**
> - ستحتاجون إلى إعادة الدخول باسم المستخدم وكلمة المرور الحاليين (لا تغيير فيهما)؛
> - ستجدون معطياتكم كما هي؛
> - من يشتغل في أكثر من مدرسة سيختار المدرسة من القائمة في أعلى الصفحة.
>
> إذا لاحظتم معطيات ناقصة أو غير صحيحة، أخبروا الإدارة فوراً: <contact>.

### Français
> **Mise à jour de l'application de « <nom de l'école> »**
>
> Bonjour,
> L'application sera mise à jour le <jour et date>, de <heure de début> à
> <heure de fin> environ ; elle sera inaccessible pendant ce temps.
>
> **Après la mise à jour :**
> - reconnectez-vous avec votre identifiant et votre mot de passe actuels
>   (ils ne changent pas) ;
> - vos données restent les mêmes ;
> - si vous travaillez dans plusieurs écoles, choisissez l'école dans la liste
>   en haut de la page.
>
> Si une donnée vous semble manquante ou erronée, prévenez l'administration
> sans attendre : <contact>.

### Retour arrière (si la bascule est annulée)
- العربية : « تعذر إتمام التحديث، وأُعيدت المنظومة إلى حالتها السابقة. يمكنكم الدخول كالمعتاد. نعتذر عن الإزعاج. »
- Français : « La mise à jour n'a pas pu être terminée ; l'application a été
  remise dans son état précédent. Vous pouvez vous connecter comme d'habitude.
  Merci de votre compréhension. »
