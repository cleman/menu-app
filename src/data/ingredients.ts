// Compact catalogue: "id|English|Français|aisle|pieceWeight g (optional)|extra aliases;sep;by;semicolons"
// Grows at runtime: unmatched ingredients can be created from the recipe editor.
export const AISLES: { id: string; name: string }[] = [
  { id: 'veg', name: 'Fruits & légumes' },
  { id: 'bakery', name: 'Boulangerie' },
  { id: 'meat', name: 'Boucherie & charcuterie' },
  { id: 'fish', name: 'Poissonnerie' },
  { id: 'dairy', name: 'Crèmerie, œufs & fromages' },
  { id: 'fresh', name: 'Frais (pâtes à tarte, tofu, traiteur)' },
  { id: 'dry', name: 'Épicerie salée (pâtes, riz, légumineuses)' },
  { id: 'cans', name: 'Conserves, bocaux & sauces' },
  { id: 'spice', name: 'Huiles, épices & condiments' },
  { id: 'sweet', name: 'Épicerie sucrée & petit-déj' },
  { id: 'frozen', name: 'Surgelés' },
  { id: 'drinks', name: 'Boissons' },
  { id: 'other', name: 'Autre' },
];

export const PANTRY_AISLES = new Set(['dry', 'cans', 'spice', 'sweet', 'frozen', 'drinks']);

export const RAW_CATALOGUE = `
onion|onion|oignon|veg|110|oignon jaune;yellow onion;onions
red-onion|red onion|oignon rouge|veg|110|red onions
white-onion|white onion|oignon blanc|veg|100|oignon nouveau;oignons nouveaux
spring-onion|spring onion|oignon vert|veg|15|cébette;cebette;ciboule;green onion;scallion;oignon cébette
shallot|shallot|échalote|veg|30|echalotte;échalotte;échalote grise;shallots
garlic|garlic|ail|veg|5|gousse d'ail;gousses d'ail;garlic clove;garlic cloves;ail frais
carrot|carrot|carotte|veg|100|carrots;carottes
potato|potato|pomme de terre|veg|150|pdt;patate;potatoes;pomme de terre à chair ferme;pomme de terre farineuse
baby-potato|baby potato|pomme de terre grenaille|veg|35|grenaille;grenailles;new potatoes;pomme de terre nouvelle
sweet-potato|sweet potato|patate douce|veg|250|sweet potatoes
tomato|tomato|tomate|veg|120|tomate ronde;tomate grappe;tomatoes;tomate fraîche
cherry-tomato|cherry tomato|tomate cerise|veg|15|tomates cerises;cherry tomatoes
beefsteak-tomato|beefsteak tomato|tomate cœur de bœuf|veg|300|tomate coeur de boeuf
courgette|courgette|courgette|veg|200|zucchini;zucchinis
aubergine|aubergine|aubergine|veg|250|eggplant
bell-pepper|bell pepper|poivron|veg|160|poivron rouge;red pepper;red bell pepper;pepper;sweet pepper
green-pepper|green pepper|poivron vert|veg|160|green bell pepper
yellow-pepper|yellow pepper|poivron jaune|veg|160|yellow bell pepper
leek|leek|poireau|veg|200|leeks;blanc de poireau
broccoli|broccoli|brocoli|veg|350|brocolis
cauliflower|cauliflower|chou-fleur|veg|600|chou fleur
romanesco|romanesco|chou romanesco|veg|500|romanesco
cabbage|cabbage|chou|veg|800|chou blanc;chou pommé;white cabbage
savoy-cabbage|savoy cabbage|chou vert|veg|900|chou frisé;chou de milan
red-cabbage|red cabbage|chou rouge|veg|900|
brussels-sprouts|brussels sprouts|chou de Bruxelles|veg|15|choux de bruxelles
chinese-cabbage|chinese cabbage|chou chinois|veg|1000|napa cabbage
bok-choy|bok choy|pak choï|veg|150|pak choi;pak-choi;bok choi
kale|kale|chou kale|veg||
spinach|spinach|épinard|veg||épinards frais;pousses d'épinard;baby spinach
chard|swiss chard|blette|veg||bette;swiss chard
lettuce|lettuce|salade|veg|300|laitue;salad;salade verte;batavia;laitue romaine;romaine
lamb-lettuce|lamb's lettuce|mâche|veg||mache;doucette
rocket|rocket|roquette|veg||arugula
endive|chicory|endive|veg|150|chicon;witloof;belgian endive
mesclun|mixed salad leaves|mesclun|veg||jeunes pousses;salad leaves
watercress|watercress|cresson|veg||
cucumber|cucumber|concombre|veg|300|
radish|radish|radis|veg|10|radis rose;botte de radis
black-radish|black radish|radis noir|veg|250|
turnip|turnip|navet|veg|120|
parsnip|parsnip|panais|veg|150|
jerusalem-artichoke|jerusalem artichoke|topinambour|veg|50|
celeriac|celeriac|céleri-rave|veg|800|celeri rave;céleri rave
celery|celery|céleri branche|veg|60|céleri;branche de céleri;celery stick
fennel|fennel|fenouil|veg|300|bulbe de fenouil
beetroot|beetroot|betterave|veg|150|betterave cuite;betterave rouge;beet
artichoke|artichoke|artichaut|veg|300|
green-asparagus|green asparagus|asperge verte|veg|20|
white-asparagus|white asparagus|asperge blanche|veg|40|asperge;asparagus
squash|squash|courge|veg|1200|potiron;pumpkin;citrouille
butternut|butternut squash|courge butternut|veg|1200|butternut;doubeurre
red-kuri|red kuri squash|potimarron|veg|1200|hokkaido
green-beans|green beans|haricots verts|veg||haricot vert;haricots verts frais
peas|peas|petits pois|veg||petit pois;pois frais
snow-peas|snow peas|pois gourmands|veg||pois gourmand;mange-tout
bean-sprouts|bean sprouts|pousses de soja|veg||germes de soja;soja frais
mushroom|mushroom|champignon de Paris|veg|20|champignon;champignons de paris;champignon blanc;button mushroom;mushrooms
brown-mushroom|chestnut mushroom|champignon brun|veg|20|champignons bruns;champignon de paris brun
shiitake|shiitake|shiitaké|veg|15|shiitake;champignon shiitake
oyster-mushroom|oyster mushroom|pleurote|veg||
chanterelle|chanterelle|girolle|veg||chanterelles
morel|morel|morille|veg||morilles fraîches
avocado|avocado|avocat|veg|170|
ginger|ginger|gingembre|veg||gingembre frais;fresh ginger
lemongrass|lemongrass|citronnelle|veg|20|citronnelle fraîche;bâton de citronnelle
fresh-chili|fresh chili|piment frais|veg|10|piment rouge;piment vert;red chili;green chili;piment oiseau
parsley|parsley|persil|veg||persil plat;persil frisé;flat-leaf parsley;botte de persil
coriander|coriander|coriandre|veg||coriandre fraîche;cilantro;fresh coriander
basil|basil|basilic|veg||basilic frais;fresh basil
mint|mint|menthe|veg||menthe fraîche;fresh mint
chives|chives|ciboulette|veg||
dill|dill|aneth|veg||
tarragon|tarragon|estragon|veg||
chervil|chervil|cerfeuil|veg||
thyme|thyme|thym|veg||thym frais;branche de thym;fresh thyme
rosemary|rosemary|romarin|veg||romarin frais;branche de romarin
sage|sage|sauge|veg||
wild-garlic|wild garlic|ail des ours|veg||
lemon|lemon|citron|veg|120|citron jaune;lemons
lime|lime|citron vert|veg|60|limes
apple|apple|pomme|veg|150|apples;pomme golden;pomme granny smith
pear|pear|poire|veg|160|pears
banana|banana|banane|veg|120|bananas
orange|orange|orange|veg|200|oranges
blood-orange|blood orange|orange sanguine|veg|180|
clementine|clementine|clémentine|veg|70|mandarine;clementines
grapefruit|grapefruit|pamplemousse|veg|350|
grape|grape|raisin|veg||raisin blanc;raisin noir;grapes
strawberry|strawberry|fraise|veg|15|strawberries
raspberry|raspberry|framboise|veg||raspberries
blueberry|blueberry|myrtille|veg||blueberries
blackberry|blackberry|mûre|veg||mure
redcurrant|redcurrant|groseille|veg||
cherry|cherry|cerise|veg|8|cherries
apricot|apricot|abricot|veg|45|
peach|peach|pêche|veg|150|peche
nectarine|nectarine|nectarine|veg|150|brugnon
plum|plum|prune|veg|40|reine-claude
mirabelle|mirabelle plum|mirabelle|veg|15|mirabelle de lorraine
quetsche|damson plum|quetsche|veg|30|questche
melon|melon|melon|veg|1000|melon charentais
watermelon|watermelon|pastèque|veg|4000|pasteque
kiwi|kiwi|kiwi|veg|80|
pineapple|pineapple|ananas|veg|1500|
mango|mango|mangue|veg|400|
passion-fruit|passion fruit|fruit de la passion|veg|40|maracuja
pomegranate|pomegranate|grenade|veg|300|grains de grenade
fig|fig|figue|veg|50|figue fraîche
rhubarb|rhubarb|rhubarbe|veg|100|
lychee|lychee|litchi|veg|20|lychees
quince|quince|coing|veg|300|
persimmon|persimmon|kaki|veg|200|
coconut|coconut|noix de coco|veg|600|
bread|bread|pain|bakery||pain de campagne;pain rassis;miche
baguette|baguette|baguette|bakery|250|baguette tradition;french stick
sandwich-bread|sandwich bread|pain de mie|bakery|25|tranche de pain de mie;pain de mie complet
wholemeal-bread|wholemeal bread|pain complet|bakery||pain aux céréales
burger-bun|burger bun|pain burger|bakery|60|pain à burger;pain à hamburger;buns;burger buns
hot-dog-bun|hot dog bun|pain à hot-dog|bakery|50|pain hot dog
tortilla|tortilla|tortilla|bakery|40|wrap;wraps;galette de blé
pita|pita bread|pain pita|bakery|70|pita;pitta
naan|naan|naan|bakery|90|pain naan
brioche|brioche|brioche|bakery||pain brioché
croissant|croissant|croissant|bakery|60|
pretzel|pretzel|bretzel|bakery|90|bretzels;pretzels
kougelhopf|kugelhopf|kougelhopf|bakery|500|kouglof;kugelhopf
chicken|chicken breast|blanc de poulet|meat|150|filet de poulet;escalope de poulet;poulet;chicken;chicken breasts
chicken-tenders|chicken tenders|aiguillettes de poulet|meat||aiguillette de poulet;émincé de poulet
whole-chicken|whole chicken|poulet entier|meat|1500|poulet fermier;whole roasting chicken
chicken-thigh|chicken thigh|cuisse de poulet|meat|250|haut de cuisse de poulet;chicken leg;chicken thighs
chicken-drumstick|chicken drumstick|pilon de poulet|meat|110|drumsticks
chicken-wings|chicken wings|aile de poulet|meat|80|wings
turkey|turkey escalope|escalope de dinde|meat|130|dinde;filet de dinde;turkey breast
turkey-ham|turkey slices|blanc de dinde|meat|30|tranche de blanc de dinde
duck-breast|duck breast|magret de canard|meat|350|magret;canard
duck-leg|confit duck leg|cuisse de canard confite|meat|300|confit de canard;cuisse de canard
guinea-fowl|guinea fowl|pintade|meat|1300|
rabbit|rabbit|lapin|meat|1500|râble de lapin
minced-beef|minced beef|bœuf haché|meat||viande hachée;ground beef;minced meat;haché de bœuf
beef-patty|beef patty|steak haché|meat|125|burger patty;hamburger patty
beef-steak|beef steak|steak de bœuf|meat|180|steak;bifteck;rumsteck;faux-filet
entrecote|rib steak|entrecôte|meat|300|ribeye
bavette|flank steak|bavette|meat|180|onglet
beef-fillet|beef fillet|filet de bœuf|meat||tournedos
beef-stew|stewing beef|bœuf à braiser|meat||bœuf bourguignon;bœuf;paleron;joue de bœuf;macreuse;plat de côtes;stewing beef;beef chuck
roast-beef|roast beef joint|rôti de bœuf|meat||
veal-escalope|veal escalope|escalope de veau|meat|120|veau
veal-stew|veal for stewing|veau pour blanquette|meat||blanquette de veau;tendron de veau;épaule de veau;sauté de veau
veal-shank|veal shank|osso buco|meat|300|jarret de veau;osso-buco
pork-chop|pork chop|côte de porc|meat|200|pork chops
pork-tenderloin|pork tenderloin|filet mignon de porc|meat|450|filet mignon
pork-roast|pork roast|rôti de porc|meat||
pork-belly|pork belly|poitrine de porc|meat||poitrine fraîche
pork-shoulder|pork shoulder|échine de porc|meat||échine;épaule de porc;sauté de porc;porc
pork-ribs|pork ribs|travers de porc|meat||ribs;spare ribs
pork-mince|sausage meat|chair à saucisse|meat||porc haché;sausage meat
ham-hock|ham hock|jambonneau|meat|800|jarret de porc;wädele
kassler|smoked pork loin|kassler|meat||carré de porc fumé;échine fumée
lamb-leg|leg of lamb|gigot d'agneau|meat||gigot
lamb-chops|lamb chops|côtelette d'agneau|meat|80|côte d'agneau
lamb-shoulder|lamb shoulder|épaule d'agneau|meat||agneau;souris d'agneau
lamb-mince|minced lamb|agneau haché|meat||ground lamb
merguez|merguez|merguez|meat|50|
sausage|sausage|saucisse|meat|100|sausages;saucisse de toulouse
frankfurter|frankfurter|saucisse de Strasbourg|meat|50|knack;knacki;saucisse de francfort;hot dog sausage
montbeliard|montbéliard sausage|saucisse de Montbéliard|meat|150|saucisse fumée
morteau|morteau sausage|saucisse de Morteau|meat|350|
chipolata|chipolata|chipolata|meat|60|
cervelas|cervelat|cervelas|meat|100|
black-pudding|black pudding|boudin noir|meat|125|boudin
ham|ham|jambon blanc|meat|40|jambon;jambon cuit;cooked ham;tranche de jambon;jambon de paris;dés de jambon
cured-ham|cured ham|jambon cru|meat|15|jambon de bayonne;jambon de parme;prosciutto;jambon de la forêt noire;jambon fumé
bacon|smoked bacon lardons|lardons fumés|meat||lardons;lardon;bacon lardons
plain-lardons|plain lardons|lardons nature|meat||lardons natures
bacon-rashers|bacon rashers|tranches de bacon|meat|10|tranche de bacon;streaky bacon;bacon en tranches
smoked-belly|smoked pork belly|poitrine fumée|meat||poitrine fumée tranchée
chorizo|chorizo|chorizo|meat||
salami|salami|saucisson sec|meat||saucisson;salami
pancetta|pancetta|pancetta|meat||
country-pate|country pâté|pâté de campagne|meat||terrine de campagne
salmon|salmon fillet|pavé de saumon|fish|125|saumon;filet de saumon;saumon frais;salmon
smoked-salmon|smoked salmon|saumon fumé|fish|20|
white-fish|cod|cabillaud|fish|125|dos de cabillaud;filet de cabillaud;cod;poisson blanc
pollock|pollock|colin|fish|125|lieu;lieu noir;merlu;hake;filet de colin
haddock|smoked haddock|haddock|fish|150|haddock fumé
salt-cod|salt cod|morue|fish||morue salée;cabillaud salé
sea-bream|sea bream|dorade|fish|400|daurade;dorade royale
sea-bass|sea bass|bar|fish|400|loup;loup de mer
trout|trout|truite|fish|300|filet de truite
smoked-trout|smoked trout|truite fumée|fish|20|
pike-perch|pike perch|sandre|fish|150|filet de sandre
mackerel|mackerel|maquereau|fish|300|
smoked-mackerel|smoked mackerel|maquereau fumé|fish|100|
sardine|sardine|sardine|fish|50|sardine fraîche
herring|herring|hareng|fish|80|filet de hareng;hareng fumé;rollmops
tuna-steak|tuna steak|steak de thon|fish|150|thon frais;pavé de thon
monkfish|monkfish|lotte|fish||queue de lotte
sole|sole|sole|fish|300|
plaice|lemon sole|limande|fish|300|limande-sole
whiting|whiting|merlan|fish|200|
skate|skate wing|aile de raie|fish|400|raie
swordfish|swordfish|espadon|fish|150|
pangasius|pangasius|panga|fish|150|pangasius
shrimp|prawns|crevette|fish|15|crevettes cuites;prawns;shrimp;crevettes décortiquées
raw-prawns|raw king prawns|crevette crue|fish|25|gambas;scampi;king prawns
langoustine|langoustine|langoustine|fish|40|
mussels|mussels|moule|fish||moules de bouchot;mussels
scallops|scallops|noix de Saint-Jacques|fish|25|saint-jacques;coquille saint-jacques;noix de saint jacques;scallop
squid|squid|calamar|fish||encornet;anneaux de calamar
octopus|octopus|poulpe|fish||
clams|clams|palourde|fish||
cockles|cockles|coque|fish||
oysters|oysters|huître|fish|80|
surimi|surimi|surimi|fish|17|bâtonnets de surimi;crab sticks
egg|egg|œuf|dairy|55|eggs;oeufs frais;gros oeuf
milk|milk|lait|dairy||lait demi-écrémé;semi-skimmed milk;lait écrémé
whole-milk|whole milk|lait entier|dairy||
buttermilk|buttermilk|lait fermenté|dairy||lait ribot;babeurre
butter|butter|beurre|dairy||beurre doux;unsalted butter
salted-butter|salted butter|beurre demi-sel|dairy||beurre salé;beurre demi sel
cream|cream|crème liquide|dairy||crème fleurette;crème liquide entière;crème entière;single cream;whipping cream;heavy cream;crème à fouetter;cream
light-cream|light cream|crème légère|dairy||crème liquide légère;crème allégée;crème fraîche légère
creme-fraiche|crème fraîche|crème fraîche épaisse|dairy||crème;crème épaisse;sour cream;crème fraîche d'alsace;crème crue
whipped-cream|whipped cream|chantilly|dairy||crème chantilly
mascarpone|mascarpone|mascarpone|dairy||
ricotta|ricotta|ricotta|dairy||
fromage-blanc|fromage blanc|fromage blanc|dairy||quark;fromage blanc battu
faisselle|faisselle|faisselle|dairy|100|
petit-suisse|petit suisse|petit-suisse|dairy|60|petits suisses
yogurt|yogurt|yaourt nature|dairy|125|yaourt;yoghourt;yoghurt;yogourt;plain yogurt
greek-yogurt|greek yogurt|yaourt à la grecque|dairy|150|yaourt grec;greek yoghurt
skyr|skyr|skyr|dairy||
soy-yogurt|soy yogurt|yaourt au soja|dairy|125|dessert au soja
cheese|grated cheese|fromage râpé|dairy||emmental râpé;gruyère râpé;grated emmental;fromage;cheese;râpé
parmesan|parmesan|parmesan|dairy||parmigiano;parmigiano reggiano;parmesan râpé;grana padano
pecorino|pecorino|pecorino|dairy||pecorino romano
emmental|emmental|emmental|dairy||emmenthal;emmental en bloc
gruyere|gruyère|gruyère|dairy||gruyère suisse
comte|comté|comté|dairy||
beaufort|beaufort|beaufort|dairy||
munster|munster|munster|dairy|200|muenster
camembert|camembert|camembert|dairy|250|
brie|brie|brie|dairy||brie de meaux
coulommiers|coulommiers|coulommiers|dairy|350|
chaource|chaource|chaource|dairy|250|
langres|langres|langres|dairy|180|
reblochon|reblochon|reblochon|dairy|450|
mont-d-or|mont d'or|vacherin mont-d'or|dairy|500|mont d'or;vacherin
raclette|raclette cheese|fromage à raclette|dairy||raclette
morbier|morbier|morbier|dairy||
tomme|tomme|tomme|dairy||tomme de savoie
mimolette|mimolette|mimolette|dairy||
cancoillotte|cancoillotte|cancoillotte|dairy||
roquefort|roquefort|roquefort|dairy||
blue-cheese|blue cheese|bleu|dairy||bleu d'auvergne;fourme d'ambert
gorgonzola|gorgonzola|gorgonzola|dairy||
goat-cheese|goat's cheese|fromage de chèvre|dairy||chèvre;bûche de chèvre;goat cheese
fresh-goat-cheese|fresh goat's cheese|chèvre frais|dairy|150|petit chèvre frais
feta|feta|feta|dairy|200|féta
mozzarella|mozzarella|mozzarella|dairy|125|mozza;boule de mozzarella;mozzarella di bufala
grated-mozzarella|grated mozzarella|mozzarella râpée|dairy||shredded mozzarella
burrata|burrata|burrata|dairy|125|
cheddar|cheddar|cheddar|dairy||cheddar râpé
cheese-slices|cheese slices|fromage en tranches|dairy|20|tranche de fromage;cheddar en tranches;tranches à burger
halloumi|halloumi|halloumi|dairy||
cream-cheese|cream cheese|fromage frais à tartiner|dairy||fromage à tartiner;fromage frais;philadelphia
soy-cream|soy cream|crème de soja|dairy||soja cuisine
pizza-dough|pizza dough|pâte à pizza|fresh|260|rouleau de pâte à pizza
puff-pastry|puff pastry|pâte feuilletée|fresh|230|rouleau de pâte feuilletée;pâte feuilletée pur beurre
shortcrust|shortcrust pastry|pâte brisée|fresh|230|rouleau de pâte brisée;pâte à tarte
sweet-pastry|sweet pastry|pâte sablée|fresh|230|pâte sucrée
flammekueche-dough|flammekueche base|pâte à tarte flambée|fresh|260|pâte à flammekueche
brick|brick pastry|feuille de brick|fresh|15|pâte à brick
filo|filo pastry|pâte filo|fresh||phyllo;pâte phyllo
tofu|tofu|tofu|fresh||tofu ferme;tofu nature
smoked-tofu|smoked tofu|tofu fumé|fresh||
fresh-pasta|fresh pasta|pâtes fraîches|fresh||tagliatelles fraîches;fresh tagliatelle
ravioli|ravioli|ravioli|fresh||raviolis
tortellini|tortellini|tortellini|fresh||
gnocchi|gnocchi|gnocchi|fresh||gnocchis
spaetzle|spätzle|spaetzle|fresh||spätzle;knepfle
udon|udon noodles|nouilles udon|fresh||udon
choucroute|sauerkraut|choucroute crue|fresh||choucroute;sauerkraut
hummus|hummus|houmous|fresh||hoummous;hummus
quenelles|quenelle|quenelle|fresh|60|quenelle de brochet
fresh-yeast|fresh yeast|levure fraîche de boulanger|fresh|42|levure de boulanger fraîche;levure fraîche;cube de levure
crepe|crêpe|crêpe|fresh|50|crêpes prêtes
buckwheat-galette|buckwheat crêpe|galette de sarrasin|fresh|60|galette bretonne
pasta|pasta|pâtes|dry||spaghetti;spaghettis;pâtes sèches;dried pasta;pasta
penne|penne|penne|dry||pennes;penne rigate
fusilli|fusilli|fusilli|dry||torsades
rigatoni|rigatoni|rigatoni|dry||
macaroni|macaroni|macaroni|dry||macaronis
coquillettes|small pasta shells|coquillettes|dry||coquillette
farfalle|farfalle|farfalle|dry||papillons
tagliatelle|tagliatelle|tagliatelles|dry||nids de tagliatelles
linguine|linguine|linguine|dry||linguines
lasagna|lasagne sheets|lasagnes|dry||feuilles de lasagne;plaques de lasagne;lasagne sheets
cannelloni|cannelloni|cannellonis|dry||cannelloni
orzo|orzo|orzo|dry||risoni;langues d'oiseau
vermicelli|vermicelli|vermicelles|dry||cheveux d'ange
alsatian-noodles|alsatian egg noodles|nouilles alsaciennes|dry||pâtes alsaciennes;nouilles d'alsace
noodles|noodles|nouilles chinoises|dry||nouilles;nouilles aux oeufs;egg noodles
ramen-noodles|ramen noodles|nouilles ramen|dry||ramen;nouilles instantanées
soba|soba noodles|nouilles soba|dry||soba
rice-noodles|rice noodles|nouilles de riz|dry||vermicelles de riz;rice vermicelli;pad thai noodles
rice|rice|riz|dry||riz long;riz blanc;long grain rice;white rice
basmati|basmati rice|riz basmati|dry||basmati
jasmine-rice|jasmine rice|riz thaï|dry||riz jasmin
arborio|risotto rice|riz arborio|dry||riz à risotto;arborio;carnaroli
round-rice|pudding rice|riz rond|dry||riz dessert
sushi-rice|sushi rice|riz à sushi|dry||riz pour sushi;riz japonais
brown-rice|brown rice|riz complet|dry||
wild-rice|wild rice|riz sauvage|dry||
lentils|green lentils|lentilles vertes|dry||lentilles;lentille;lentilles du puy;lentils
red-lentils|red lentils|lentilles corail|dry||lentille corail
beluga-lentils|black lentils|lentilles beluga|dry||lentilles noires
dried-chickpeas|dried chickpeas|pois chiches secs|dry||
split-peas|split peas|pois cassés|dry||
dried-white-beans|dried white beans|haricots blancs secs|dry||lingots;cocos
couscous|couscous|semoule de couscous|dry||couscous;semoule;semoule moyenne
fine-semolina|fine semolina|semoule fine|dry||semoule extra-fine;semoule de blé dur
bulgur|bulgur|boulgour|dry||boulghour;bulghur
quinoa|quinoa|quinoa|dry||
wheat|durum wheat|blé|dry||ebly;blé tendre
pearl-barley|pearl barley|orge perlé|dry||
polenta|polenta|polenta|dry||semoule de maïs;polenta instantanée
tapioca|tapioca|tapioca|dry||
breadcrumbs|breadcrumbs|chapelure|dry||
panko|panko|panko|dry||chapelure panko
cornstarch|cornflour|fécule de maïs|dry||maïzena;cornstarch;amidon de maïs
potato-starch|potato starch|fécule de pomme de terre|dry||fécule
mashed-potato-flakes|mashed potato flakes|purée en flocons|dry||flocons de purée
rice-paper|rice paper|galette de riz|dry|10|feuille de riz
dried-mushrooms|dried mushrooms|champignons séchés|dry||cèpes séchés;morilles séchées;champignons secs
tortilla-chips|tortilla chips|chips de maïs|dry||nachos;tortilla chips
crisps|crisps|chips|dry||chips de pommes de terre
crackers|crackers|crackers|dry||biscuits apéritif
breadsticks|breadsticks|gressins|dry||
croutons|croutons|croûtons|dry||
popcorn|popcorn kernels|maïs à pop-corn|dry||popcorn
tuna|tinned tuna|thon en conserve|cans||thon;thon en boite;thon au naturel;tuna;canned tuna
sardines-tin|tinned sardines|sardines à l'huile|cans||sardines en boite;sardines en conserve
mackerel-tin|tinned mackerel|maquereaux au vin blanc|cans||maquereaux en conserve
anchovies|anchovies|anchois|cans|4|filets d'anchois;anchovy
crab-meat|crab meat|chair de crabe|cans||crabe
chickpeas|chickpeas|pois chiches|cans||pois chiche;chickpea;pois chiches en conserve
kidney-beans|kidney beans|haricots rouges|cans||haricot rouge;red kidney beans
white-beans|white beans|haricots blancs|cans||haricot blanc;cannellini;cannellini beans
flageolets|flageolet beans|flageolets|cans||flageolet
black-beans|black beans|haricots noirs|cans||
cooked-lentils|cooked lentils|lentilles en conserve|cans||lentilles cuites
sweetcorn|sweetcorn|maïs|cans||maïs doux;corn;sweet corn
crushed-tomatoes|chopped tomatoes|tomates concassées|cans||chopped tomatoes;tomates en dés;diced tomatoes;tomates en conserve;canned tomatoes;tomates concassées en conserve
peeled-tomatoes|peeled tomatoes|tomates pelées|cans||whole peeled tomatoes;tomates entières pelées
passata|passata|coulis de tomate|cans||passata;purée de tomate;tomato passata;tomates passées
tomato-paste|tomato paste|concentré de tomate|cans||double concentré de tomate;tomato puree
tomato-sauce|tomato sauce|sauce tomate|cans||sauce tomate cuisinée;marinara
bolognese-sauce|bolognese sauce|sauce bolognaise|cans||
coconut-milk|coconut milk|lait de coco|cans||
coconut-cream|coconut cream|crème de coco|cans||
black-olives|black olives|olive noire|cans||olives de kalamata
green-olives|green olives|olive verte|cans||olives
capers|capers|câpre|cans||
gherkins|gherkins|cornichon|cans|8|
pickled-onions|cocktail onions|petits oignons au vinaigre|cans||oignons grelots
jalapenos|jalapeños|jalapeño|cans||piments jalapeños
sun-dried-tomatoes|sun-dried tomatoes|tomates séchées|cans||
roasted-peppers|roasted peppers|poivrons grillés|cans||poivrons marinés
artichoke-hearts|artichoke hearts|cœurs d'artichaut|cans||fonds d'artichaut
tinned-mushrooms|tinned mushrooms|champignons de Paris en conserve|cans||champignons en boite
tinned-green-beans|tinned green beans|haricots verts en conserve|cans||
peas-carrots|peas and carrots|petits pois carottes|cans||petits pois et carottes
bamboo-shoots|bamboo shoots|pousses de bambou|cans||
chestnuts|cooked chestnuts|marrons cuits|cans||châtaignes;marrons
pesto|pesto|pesto|cans||pesto alla genovese;pesto vert;pesto au basilic
red-pesto|red pesto|pesto rouge|cans||pesto rosso
curry-paste|red curry paste|pâte de curry rouge|cans||pâte de curry;curry paste
green-curry-paste|green curry paste|pâte de curry vert|cans||
tahini|tahini|tahin|cans||tahini;crème de sésame;purée de sésame
salsa|salsa|sauce salsa|cans||salsa
duck-fat|duck fat|graisse de canard|cans||graisse d'oie
canned-peaches|canned peaches|pêches au sirop|cans||
canned-pineapple|canned pineapple|ananas au sirop|cans||ananas en boite
apple-compote|apple compote|compote de pommes|cans|100|compote;apple sauce
morello-cherries|morello cherries|griottes au sirop|cans||griottes;cerises au sirop
olive-oil|olive oil|huile d'olive|spice||huile;huile d'olive vierge extra;extra virgin olive oil;huile olive
sunflower-oil|sunflower oil|huile de tournesol|spice||huile neutre;vegetable oil;huile végétale;neutral oil;huile de friture
rapeseed-oil|rapeseed oil|huile de colza|spice||canola oil
sesame-oil|sesame oil|huile de sésame|spice||huile de sésame grillé
walnut-oil|walnut oil|huile de noix|spice||
peanut-oil|peanut oil|huile d'arachide|spice||
vinegar|vinegar|vinaigre|spice||vinaigre de vin;vinaigre de vin rouge;red wine vinegar;wine vinegar;vinaigre de vin blanc
white-vinegar|white vinegar|vinaigre blanc|spice||vinaigre d'alcool
balsamic|balsamic vinegar|vinaigre balsamique|spice||balsamique;vinaigre balsamique de modène;crème de balsamique
cider-vinegar|cider vinegar|vinaigre de cidre|spice||apple cider vinegar
rice-vinegar|rice vinegar|vinaigre de riz|spice||
sherry-vinegar|sherry vinegar|vinaigre de Xérès|spice||
salt|salt|sel|spice||sel fin;gros sel;sel de mer;fine salt
fleur-de-sel|fleur de sel|fleur de sel|spice||
pepper-black|black pepper|poivre noir|spice||poivre;poivre moulu;poivre du moulin;ground pepper
white-pepper|white pepper|poivre blanc|spice||
paprika|paprika|paprika|spice||paprika doux
smoked-paprika|smoked paprika|paprika fumé|spice||pimenton
cumin|cumin|cumin|spice||cumin en poudre;ground cumin;graines de cumin
curry|curry powder|curry en poudre|spice||curry;curry doux
turmeric|turmeric|curcuma|spice||
garam-masala|garam masala|garam masala|spice||
tandoori|tandoori spice|épices tandoori|spice||tandoori
ras-el-hanout|ras el hanout|ras el hanout|spice||ras-el-hanout
five-spice|five spice|cinq-épices|spice||5 épices
quatre-epices|four spice|quatre-épices|spice||
chili|chili flakes|piment en poudre|spice||piment;piment séché;flocons de piment;chili;chili powder;piment fort
espelette|espelette pepper|piment d'Espelette|spice||espelette
cayenne|cayenne pepper|piment de Cayenne|spice||cayenne
nutmeg|nutmeg|noix de muscade|spice||muscade;muscade râpée
cinnamon|cinnamon|cannelle|spice||cannelle en poudre;bâton de cannelle;cinnamon stick
ginger-ground|ground ginger|gingembre en poudre|spice||
coriander-ground|ground coriander|coriandre en poudre|spice||graines de coriandre;coriander seeds
cloves|cloves|clou de girofle|spice||girofle
star-anise|star anise|anis étoilé|spice||badiane
cardamom|cardamom|cardamome|spice||
saffron|saffron|safran|spice||
mustard-seeds|mustard seeds|graines de moutarde|spice||
herbs|herbes de Provence|herbes de Provence|spice||mixed herbs;dried herbs;herbes séchées
oregano|oregano|origan|spice||origan séché;dried oregano
dried-thyme|dried thyme|thym séché|spice||
bay-leaf|bay leaf|feuille de laurier|spice||laurier;bay leaves
bouquet-garni|bouquet garni|bouquet garni|spice|10|
juniper|juniper berries|baies de genièvre|spice||genièvre;baie de genièvre
caraway|caraway|carvi|spice||graines de carvi;cumin des prés
sumac|sumac|sumac|spice||
zaatar|za'atar|zaatar|spice||za'atar
sesame-seeds|sesame seeds|graines de sésame|spice||sésame
garlic-powder|garlic powder|ail en poudre|spice||ail semoule
stock-cube|stock cube|bouillon cube|spice|10|cube de bouillon;bouillon;bouillon de légumes;vegetable stock
chicken-stock|chicken stock cube|bouillon de volaille|spice|10|bouillon de poule;cube de volaille;chicken stock
beef-stock|beef stock cube|bouillon de bœuf|spice|10|beef stock;bouillon de pot-au-feu
fond-de-veau|veal stock powder|fond de veau|spice||fond brun
fish-stock|fish stock|fumet de poisson|spice||
soy-sauce|soy sauce|sauce soja|spice||sauce soja salée;shoyu
sweet-soy|sweet soy sauce|sauce soja sucrée|spice||kecap manis
fish-sauce|fish sauce|nuoc-mâm|spice||nuoc mam;sauce de poisson
oyster-sauce|oyster sauce|sauce d'huître|spice||sauce huître
hoisin|hoisin sauce|sauce hoisin|spice||
sriracha|sriracha|sriracha|spice||
tabasco|hot sauce|Tabasco|spice||sauce piquante
worcestershire|worcestershire sauce|sauce Worcestershire|spice||worcester
mustard|mustard|moutarde|spice||moutarde de dijon;moutarde forte;dijon mustard
wholegrain-mustard|wholegrain mustard|moutarde à l'ancienne|spice||moutarde en grains
ketchup|ketchup|ketchup|spice||
mayonnaise|mayonnaise|mayonnaise|spice||mayo
bbq-sauce|barbecue sauce|sauce barbecue|spice||sauce bbq
harissa|harissa|harissa|spice||
miso|miso|miso|spice||pâte de miso
wasabi|wasabi|wasabi|spice||
mirin|mirin|mirin|spice||
ghee|ghee|beurre clarifié|spice||
vinaigrette|salad dressing|vinaigrette|spice||sauce salade
horseradish|horseradish|raifort|spice||
sugar|sugar|sucre|sweet||sucre en poudre;sucre semoule;sucre blanc;caster sugar;white sugar
brown-sugar|brown sugar|sucre roux|sweet||cassonade;sucre complet;vergeoise
icing-sugar|icing sugar|sucre glace|sweet||powdered sugar
vanilla-sugar|vanilla sugar|sucre vanillé|sweet|8|sachet de sucre vanillé
sugar-cubes|sugar cubes|sucre en morceaux|sweet|5|
flour|flour|farine|sweet||farine de blé;farine t55;farine t45;plain flour;all-purpose flour
wholemeal-flour|wholemeal flour|farine complète|sweet||farine t110;farine t150
buckwheat-flour|buckwheat flour|farine de sarrasin|sweet||farine de blé noir
chickpea-flour|chickpea flour|farine de pois chiche|sweet||
baking-powder|baking powder|levure chimique|sweet|11|sachet de levure;levure;poudre à lever
dry-yeast|dried yeast|levure de boulanger sèche|sweet|8|levure boulangère;levure sèche;levure de boulanger;instant yeast
baking-soda|baking soda|bicarbonate de soude|sweet||bicarbonate
vanilla-extract|vanilla extract|extrait de vanille|sweet||arôme vanille;vanille liquide;vanilla
vanilla-pod|vanilla pod|gousse de vanille|sweet|3|vanille;vanilla bean
gelatin|gelatine|gélatine|sweet|2|feuille de gélatine
agar|agar-agar|agar-agar|sweet||agar
dark-chocolate|dark chocolate|chocolat noir pâtissier|sweet||chocolat noir;chocolat pâtissier;chocolat;chocolate;chocolat à cuire
milk-chocolate|milk chocolate|chocolat au lait|sweet||
white-chocolate|white chocolate|chocolat blanc|sweet||
chocolate-chips|chocolate chips|pépites de chocolat|sweet||
cocoa|cocoa powder|cacao en poudre|sweet||cacao;cacao non sucré;cocoa
chocolate-powder|drinking chocolate|chocolat en poudre|sweet||poudre chocolatée
ground-almonds|ground almonds|poudre d'amande|sweet||amandes en poudre;almond flour;amande en poudre
almonds|almonds|amande|sweet|1|amandes entières
flaked-almonds|flaked almonds|amandes effilées|sweet||
hazelnuts|hazelnuts|noisette|sweet||
ground-hazelnuts|ground hazelnuts|poudre de noisette|sweet||noisettes en poudre
walnuts|walnuts|noix|sweet||cerneaux de noix;walnut
pecans|pecans|noix de pécan|sweet||
cashews|cashews|noix de cajou|sweet||
pistachios|pistachios|pistache|sweet||
pine-nuts|pine nuts|pignon de pin|sweet||pignons
peanuts|peanuts|cacahuète|sweet||cacahouète;arachide
desiccated-coconut|desiccated coconut|noix de coco râpée|sweet||coco râpée;coconut flakes
sultanas|sultanas|raisins secs|sweet||raisin sec;sultanines
dried-apricots|dried apricots|abricots secs|sweet||abricot sec
dates|dates|datte|sweet|8|dattes medjool
dried-prunes|dried prunes|pruneau|sweet|10|pruneaux d'agen
dried-figs|dried figs|figue sèche|sweet|20|
cranberries|dried cranberries|cranberries séchées|sweet||cranberries;canneberges
sunflower-seeds|sunflower seeds|graines de tournesol|sweet||
pumpkin-seeds|pumpkin seeds|graines de courge|sweet||
chia|chia seeds|graines de chia|sweet||chia
linseed|flaxseed|graines de lin|sweet||
honey|honey|miel|sweet||miel liquide;miel d'acacia
maple-syrup|maple syrup|sirop d'érable|sweet||
caramel|caramel sauce|caramel liquide|sweet||caramel
jam|jam|confiture|sweet||confiture de fraises;confiture d'abricots
chocolate-spread|chocolate spread|pâte à tartiner|sweet||nutella
peanut-butter|peanut butter|beurre de cacahuète|sweet||
chestnut-cream|chestnut spread|crème de marrons|sweet||
marzipan|marzipan|pâte d'amande|sweet||
condensed-milk|condensed milk|lait concentré sucré|sweet||lait concentré
oats|oats|flocons d'avoine|sweet||porridge oats;porridge;rolled oats;avoine
cereals|breakfast cereals|céréales|sweet||corn flakes;cornflakes
muesli|muesli|muesli|sweet||granola
coffee|coffee|café|sweet||café moulu;ground coffee;expresso
tea|black tea|thé noir|sweet|2|sachet de thé;tea bag
green-tea|green tea|thé vert|sweet|2|
speculoos|speculoos|spéculoos|sweet|8|
ladyfingers|ladyfingers|biscuit à la cuillère|sweet|6|boudoirs;biscuit cuillère
petit-beurre|butter biscuits|petit-beurre|sweet|8|petits beurre
rusks|rusks|biscotte|sweet|10|
gingerbread|gingerbread|pain d'épices|sweet||
frozen-spinach|frozen spinach|épinards surgelés|frozen||épinards hachés surgelés
frozen-peas|frozen peas|petits pois surgelés|frozen||
frozen-green-beans|frozen green beans|haricots verts surgelés|frozen||
frozen-broccoli|frozen broccoli|brocolis surgelés|frozen||
frozen-veg-mix|frozen mixed vegetables|légumes surgelés|frozen||poêlée de légumes;jardinière de légumes;macédoine
stir-fry-veg|stir-fry vegetables|légumes pour wok|frozen||poêlée asiatique
broad-beans|broad beans|fèves surgelées|frozen||fèves
edamame|edamame|edamame|frozen||fèves de soja
frozen-fries|french fries|frites surgelées|frozen||frites;fries
frozen-fish|frozen fish fillets|filets de poisson surgelés|frozen||poisson surgelé
fish-fingers|fish fingers|poisson pané|frozen|25|bâtonnets de poisson;fish sticks
seafood-mix|seafood mix|cocktail de fruits de mer|frozen||fruits de mer
frozen-berries|frozen berries|fruits rouges surgelés|frozen||fruits rouges;mixed berries
frozen-raspberries|frozen raspberries|framboises surgelées|frozen||
frozen-herbs|frozen herbs|herbes surgelées|frozen||fines herbes
frozen-onion|frozen chopped onion|oignons émincés surgelés|frozen||
frozen-ceps|frozen porcini|cèpes surgelés|frozen||cèpe;porcini
gyoza|gyoza|gyoza|frozen|20|raviolis chinois
ice-cream|vanilla ice cream|glace vanille|frozen||glace;ice cream
frozen-puff-pastry|frozen puff pastry|pâte feuilletée surgelée|frozen||
white-wine|white wine|vin blanc|drinks||vin blanc sec;dry white wine;riesling;vin d'alsace
red-wine|red wine|vin rouge|drinks||
cremant|crémant|crémant d'Alsace|drinks||crémant;mousseux
beer|beer|bière|drinks|330|bière blonde
cider|cider|cidre|drinks||cidre brut
port|port|porto|drinks||
cognac|cognac|cognac|drinks||armagnac;brandy
rum|rum|rhum|drinks||rhum brun
kirsch|kirsch|kirsch|drinks||
orange-liqueur|orange liqueur|liqueur d'orange|drinks||cointreau;grand marnier
oat-milk|oat milk|lait d'avoine|drinks||boisson à l'avoine;boisson avoine
soy-milk|soy milk|lait de soja|drinks||boisson au soja
almond-milk|almond milk|lait d'amande|drinks||boisson amande
orange-juice|orange juice|jus d'orange|drinks||
apple-juice|apple juice|jus de pomme|drinks||
sparkling-water|sparkling water|eau gazeuse|drinks||eau pétillante
baking-paper|baking paper|papier cuisson|other||papier sulfurisé
foil|aluminium foil|papier aluminium|other||papier alu
cling-film|cling film|film alimentaire|other||
skewers|skewers|pique à brochette|other||brochettes en bois
paper-cases|paper cases|caissette en papier|other||caissettes à muffins
ice-cubes|ice cubes|glaçons|other||
`;
