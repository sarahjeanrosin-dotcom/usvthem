-- Seed: Genea + initial 7 competitors
-- Run after migrations are applied

insert into public.competitors (name, is_genea, website, help_center_url, product_news_urls, active) values
(
  'Genea',
  true,
  'https://www.getgenea.com',
  'https://help.getgenea.com/en/',
  '["https://help.getgenea.com/en/articles/9276313-genea-security-product-updates", "https://portal.productboard.com/getgenea/6-customer-portal/tabs/19-in-progress", "https://portal.productboard.com/getgenea/6-customer-portal/tabs/20-released"]',
  true
),
(
  'Brivo',
  false,
  'https://www.brivo.com',
  'https://support.brivo.com/s/?language=en_US',
  '["https://www.brivo.com/about/product-news/"]',
  true
),
(
  'Acre',
  false,
  'https://www.acresecurity.com',
  'https://www.acresecurity.com/support-portal',
  '[]',
  true
),
(
  'Verkada',
  false,
  'https://www.verkada.com',
  'https://help.verkada.com/',
  '[]',
  true
),
(
  'Lenel S2',
  false,
  'https://www.lenel.com',
  'https://buildings.honeywell.com/us/en/support/technical-support/technical-solutions?facetgroup=brand&facet=LenelS2',
  '[]',
  true
),
(
  'Genetec',
  false,
  'https://www.genetec.com',
  'https://techdocs.genetec.com/',
  '["https://techdocs.genetec.com/r/en-US/Security-Center-Release-Notes-5.13.3.0/Release-notes"]',
  true
),
(
  'Gallagher',
  false,
  'https://security.gallagher.com',
  'https://help.security.gallagher.com/smb/resources/technical-guides',
  '[]',
  true
),
(
  'Avigilon Alta',
  false,
  'https://www.avigilon.com',
  'https://www.avigilon.com/blog/avigilon-brand-transition-faqs',
  '[]',
  true
);
