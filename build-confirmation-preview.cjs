const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'Reservation Confirmation Email.html');
const outPath = path.join(__dirname, 'Reservation Confirmation Email Preview.html');

let html = fs.readFileSync(srcPath, 'utf8');

html = html.replace(
  '<style type="text/css">',
  `<style type="text/css">
.preview-hide { display:none !important; mso-hide:all; max-height:0; overflow:hidden; line-height:0; font-size:0; }
.hero-overlay-brand { display:none !important; mso-hide:all; max-height:0; overflow:hidden; }`
);

const hidePatterns = [
  ['<tr class="elementShow[M<canceledTrip>]">', '<tr class="preview-hide">'],
  ['<tr class="elementShow[M<cash>]">', '<tr class="preview-hide">'],
  ['<tr class="elementShow[M<voucher>]">', '<tr class="preview-hide">'],
  ['<table role="presentation" cellspacing="0" cellpadding="0" align="center" class="v elementShow[M<!airportPu>]"', '<table role="presentation" cellspacing="0" cellpadding="0" align="center" class="v preview-hide"'],
  ['<tr class="elementShow[T<!Fare>]">', '<tr class="preview-hide">'],
  ['<tr class="elementShow[T<FopRequirements>]">', '<tr class="preview-hide">'],
  ['<tr class="elementShow[T<CouponAmt>]">', '<tr class="preview-hide">'],
];
for (const [from, to] of hidePatterns) html = html.replace(from, to);

html = html.split('<tr class="elementShow[M<!canceledTrip>]">').join('<tr>');

const stripClasses = [
  ' class="elementShow[M<!canceledTrip>]"',
  ' class="elementShow[M<creditcard>]"',
  ' class="elementShow[T<CarType>]"',
  ' class="elementShow[T<CarType>] row-rule"',
  ' class="elementShow[T<PuPrimary>]"',
  ' class="elementShow[T<PuPrimary>] row-rule"',
  ' class="elementShow[T<DoPrimary>]"',
  ' class="elementShow[T<DoPrimary>] row-rule"',
  ' class="elementShow[T<Fare>]"',
  ' class="elementShow[T<Comments>]"',
  ' class="elementShow[T<CompEmail>]"',
  ' class="elementShow[T<CompLocalPhone>]"',
  ' class="elementShow[T<CompWebsite>]"',
  ' class="elementShow[T<CompAddress>]"',
  ' class="v elementShow[M<airportPu>]"',
];
for (const cls of stripClasses) {
  html = html.replace(cls, cls.includes('row-rule') ? ' class="row-rule"' : cls.includes('airportPu') ? ' class="v"' : '');
}

html = html.replace(/<!--LoopStopsStart-->[\s\S]*?<!--LoopStopsEnd-->/, '');

const tags = {
  '&lt;%JobId%&gt;': '1390478',
  '&lt;%CompName%&gt;': 'Legends Limousine',
  '&lt;%CfstNm%&gt;': 'Jessica',
  '&lt;%ClstNm%&gt;': 'Aronson',
  '&lt;%DateTime%&gt;': 'Monday, June 15, 2026 at 9:00 PM',
  '&lt;%Psngr%&gt;': '4',
  '&lt;%CarType%&gt;': 'Luxury SUV',
  '&lt;%CCfnl4%&gt;': 'American Express ending in 5002',
  '&lt;%PuPrimary%&gt;': 'JFK Airport',
  '&lt;%PuSecondary%&gt;': 'American Airlines Flight 166, <strong>Terminal 8</strong>',
  '&lt;%DoPrimary%&gt;': '501 E 79 St',
  '&lt;%DoSecondary%&gt;': 'New York, NY 10075',
  '&lt;%Fare%&gt;': '196.00',
  '&lt;%Comments%&gt;': 'Please have bottled water in the vehicle. Child seat required.',
  '&lt;%CompPhone%&gt;': '1-888-LEGENDS (534-3637)',
  '&lt;%CompLocalPhone%&gt;': '212-758-5500',
  '&lt;%CompEmail%&gt;': 'reservations@legendslimousine.com',
  '&lt;%CompWebsite%&gt;': 'www.legendslimousine.com',
  '&lt;%CompAddress%&gt;': '123-01 23rd Ave, East Elmhurst, NY 11369',
  '&lt;%CopyrightYear%&gt;': '2026',
  '<%HeroImageUrl%>': 'email-assets/legends-header.png',
  '<%CompLogo%>': '',
  '<%TermsUrl%>': 'https://www.legendslimousine.com/terms',
  '<%PrivacyUrl%>': 'https://www.legendslimousine.com/privacy',
  '<%bgColor1stG%>': '#FFFFFF',
  '<%CompEmail%>': 'reservations@legendslimousine.com',
  '<%CompWebsite%>': 'https://www.legendslimousine.com',
};

for (const [tag, value] of Object.entries(tags)) {
  html = html.split(tag).join(value);
}

html = html.replace(/<img class="elementShow\[T<CompLogo>\]" src=""[^>]*>\s*/g, '');

html = html.replace(/elementShow\[[^\]]+\]\s*/g, '');

html = html.replace(
  '<title>Reservation Confirmation</title>',
  '<title>Reservation Confirmation (Preview)</title>'
);

const banner = `<!-- PREVIEW FILE: sample data for browser preview only. Not a production template. -->
`;
fs.writeFileSync(outPath, banner + html, 'utf8');
console.log('Wrote', outPath);
