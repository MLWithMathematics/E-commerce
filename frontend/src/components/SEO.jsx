import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'WipSom'
const DEFAULT_DESC = 'Shop the latest products at WipSom — quality, speed, and great prices.'
const DEFAULT_IMAGE = '/og-image.png'
const BASE_URL = import.meta.env.VITE_CLIENT_URL || 'https://wipsom.com'

/**
 * SEO
 * Drop-in Helmet wrapper for every page.
 *
 * <SEO
 *   title="Product Name"
 *   description="Short description"
 *   image={product.image_url}
 *   type="product"                     // og:type
 *   price={product.price}              // product schema
 *   availability={product.stock > 0}   // product schema
 *   canonical="/products/42"
 * />
 */
export default function SEO({
  title,
  description = DEFAULT_DESC,
  image       = DEFAULT_IMAGE,
  type        = 'website',
  canonical,
  price,
  availability,
  noindex     = false,
}) {
  const fullTitle   = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : null

  // JSON-LD: Product schema when price is present
  const productSchema = price !== undefined
    ? JSON.stringify({
        '@context':   'https://schema.org',
        '@type':      'Product',
        name:         title,
        description,
        image,
        offers: {
          '@type':       'Offer',
          priceCurrency: 'INR',
          price:         parseFloat(price).toFixed(2),
          availability:  availability
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: canonicalUrl,
        },
      })
    : null

  // JSON-LD: Website schema for homepage
  const websiteSchema = type === 'website'
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type':    'WebSite',
        name:       SITE_NAME,
        url:        BASE_URL,
        potentialAction: {
          '@type':       'SearchAction',
          target:        `${BASE_URL}/products?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      })
    : null

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image.startsWith('http') ? image : `${BASE_URL}${image}`} />
      <meta property="og:type"        content={type} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name"   content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image.startsWith('http') ? image : `${BASE_URL}${image}`} />

      {/* JSON-LD structured data */}
      {productSchema && (
        <script type="application/ld+json">{productSchema}</script>
      )}
      {websiteSchema && (
        <script type="application/ld+json">{websiteSchema}</script>
      )}
    </Helmet>
  )
}
