module.exports = {
  siteMetadata: {
    title: `Decoupled translations`,
    description: `Kick off your next, great Gatsby project with this default starter. This barebones starter ships with the main Gatsby configuration files you might need.`,
    author: `@gatsbyjs`,
    siteUrl: `https://localhost:8000`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    {
      resolve: `gatsby-theme-i18n`,
      options: {
        defaultLang: `en`,
        locales: process.env.LOCALES || `en es`,
        configPath: require.resolve(`./i18n/config.json`),
      },
    },
    {
      resolve: `gatsby-source-drupal`,
      options: {
        baseUrl: `http://decoupled-translations.ddev.site/`,
        allowedLinkTypes: ["node--recipe"],
        basicAuth: {
          username: `admin`,
          password: `admin`,
        },
        translation: true,
      },
    },
    {
      resolve: "gatsby-plugin-drupal-i18next",
      options: {
        baseUrl: "http://decoupled-translations.ddev.site/",
        basicAuth: {
          username: `admin`,
          password: `test123`,
        },
        i18nextOptions: {
          keySeparator: false, // we do not use keys in form of messages.welcome
          interpolation: {
            escapeValue: false, // react already saves us from xss
          },
          react: {
            useSuspense: false,
          },
        },
      },
    },
    `gatsby-plugin-graphql-codegen`,
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
