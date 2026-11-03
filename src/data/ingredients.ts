// Compact catalogue: "id|English|Français|aisle|pieceWeight g (optional)|extra aliases;sep;by;semicolons"
// Grows at runtime: unmatched ingredients can be created from the recipe editor.
export const AISLES: { id: string; name: string }[] = [
  { id: 'veg', name: 'Fruit & veg' },
  { id: 'bakery', name: 'Bakery' },
  { id: 'meat', name: 'Meat & fish' },
  { id: 'dairy', name: 'Dairy & eggs' },
  { id: 'dry', name: 'Pasta, rice & dry goods' },
  { id: 'cans', name: 'Tins, jars & sauces' },
  { id: 'spice', name: 'Oils, spices & condiments' },
  { id: 'frozen', name: 'Frozen' },
  { id: 'other', name: 'Other' },
];

export const PANTRY_AISLES = new Set(['dry', 'cans', 'spice', 'frozen']);

export const RAW_CATALOGUE = `
onion|onion|oignon|veg|110|oignon jaune;yellow onion
red-onion|red onion|oignon rouge|veg|110
shallot|shallot|échalote|veg|30|echalotte
garlic|garlic|ail|veg|5|garlic clove;gousse d'ail
carrot|carrot|carotte|veg|100
potato|potato|pomme de terre|veg|150|patate;potatoes
sweet-potato|sweet potato|patate douce|veg|250
tomato|tomato|tomate|veg|120
cherry-tomato|cherry tomato|tomate cerise|veg|15
courgette|courgette|courgette|veg|200|zucchini
aubergine|aubergine|aubergine|veg|250|eggplant
bell-pepper|bell pepper|poivron|veg|160|pepper;poivron rouge;red pepper
leek|leek|poireau|veg|200
broccoli|broccoli|brocoli|veg|350
cauliflower|cauliflower|chou-fleur|veg|600|chou fleur
cabbage|cabbage|chou|veg|800
spinach|spinach|épinard|veg||pousses d'épinard;baby spinach
lettuce|lettuce|salade|veg|300|laitue;salad
cucumber|cucumber|concombre|veg|300
mushroom|mushroom|champignon|veg|20|champignons de paris
squash|squash|courge|veg|1200|butternut;potiron;pumpkin
green-beans|green beans|haricots verts|veg||haricot vert
peas|peas|petits pois|veg||petit pois
lemon|lemon|citron|veg|120
lime|lime|citron vert|veg|60
apple|apple|pomme|veg|150
banana|banana|banane|veg|120
avocado|avocado|avocat|veg|170
ginger|ginger|gingembre|veg|
parsley|parsley|persil|veg|
coriander|coriander|coriandre|veg||cilantro
basil|basil|basilic|veg|
bread|bread|pain|bakery||baguette
tortilla|tortilla|tortilla|bakery|40|wrap;wraps
chicken|chicken breast|blanc de poulet|meat|150|poulet;filet de poulet;chicken
minced-beef|minced beef|bœuf haché|meat||boeuf hache;viande hachee;ground beef;steak hache
ham|ham|jambon|meat|40|jambon blanc
bacon|bacon lardons|lardons|meat||lardon;bacon
sausage|sausage|saucisse|meat|100
salmon|salmon|saumon|meat|125|pavé de saumon;pave de saumon
white-fish|white fish|cabillaud|meat|125|colin;cod;poisson blanc
tuna|tinned tuna|thon|cans||thon en boite;tuna
egg|egg|œuf|dairy|55|oeuf;eggs
milk|milk|lait|dairy|
butter|butter|beurre|dairy|
cream|cream|crème fraîche|dairy||creme;creme liquide;crème;creme fraiche
yogurt|yogurt|yaourt|dairy|125|yaourt nature;yoghurt
cheese|grated cheese|fromage râpé|dairy||emmental;gruyere;gruyère;fromage
parmesan|parmesan|parmesan|dairy|
feta|feta|feta|dairy|
mozzarella|mozzarella|mozzarella|dairy|125
pasta|pasta|pâtes|dry||pates;spaghetti;penne;fusilli
rice|rice|riz|dry||riz basmati;basmati rice
lentils|lentils|lentilles|dry||lentilles corail;red lentils;lentille
chickpeas|chickpeas|pois chiches|cans||pois chiche
kidney-beans|kidney beans|haricots rouges|cans||haricot rouge
couscous|couscous|semoule|dry||couscous
flour|flour|farine|dry|
sugar|sugar|sucre|dry|
oats|oats|flocons d'avoine|dry||porridge oats
quinoa|quinoa|quinoa|dry|
noodles|noodles|nouilles|dry||nouilles chinoises
crushed-tomatoes|crushed tomatoes|tomates concassées|cans||tomates pelees;chopped tomatoes;passata;coulis de tomate
tomato-paste|tomato paste|concentré de tomate|cans||concentre de tomate
coconut-milk|coconut milk|lait de coco|cans|
stock-cube|stock cube|bouillon cube|spice|10|cube de bouillon;bouillon
olive-oil|olive oil|huile d'olive|spice||huile
soy-sauce|soy sauce|sauce soja|spice|
mustard|mustard|moutarde|spice|
vinegar|vinegar|vinaigre|spice|
honey|honey|miel|spice|
salt|salt|sel|spice|
pepper-black|black pepper|poivre|spice||poivre noir
paprika|paprika|paprika|spice|
cumin|cumin|cumin|spice|
curry|curry powder|curry|spice||curry en poudre
chili|chili flakes|piment|spice||chili;piment d'espelette
nutmeg|nutmeg|noix de muscade|spice||muscade
cinnamon|cinnamon|cannelle|spice|
herbs|mixed herbs|herbes de Provence|spice||herbes de provence;thym;thyme;oregano;origan
frozen-spinach|frozen spinach|épinards surgelés|frozen||epinards surgeles
frozen-peas|frozen peas|petits pois surgelés|frozen|
pizza-dough|pizza dough|pâte à pizza|dairy||pate a pizza
puff-pastry|puff pastry|pâte feuilletée|dairy||pate feuilletee;pâte brisée;pate brisee;shortcrust pastry
`;
