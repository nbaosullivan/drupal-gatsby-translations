/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/node-apis/
 */

const path = require("path")
// Implement the Gatsby API “createPages”. This is called once the
// data layer is bootstrapped to let plugins create pages from data.
exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  // Query for recipe nodes to use in creating pages.
  const result = await graphql(
    `
      {
        allNodeRecipe {
          edges {
            node {
              langcode
              drupal_id
              path {
                alias
              }
            }
          }
        }
      }
    `
  )

  // Handle errors
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`)
    return
  }

  // Create pages for each recipe.
  const recipeTemplate = path.resolve(`src/templates/recipe.tsx`)

  result.data.allNodeRecipe.edges.forEach(({ node }) => {
    const path = node.path.alias
    createPage({
      path,
      component: recipeTemplate,
      // In your blog post template's graphql query, you can use pagePath
      // as a GraphQL variable to query for data from the markdown file.
      context: {
        id: node.drupal_id,
        langcode: node.langcode,
        pagePath: path,
      },
    })
  })
}
