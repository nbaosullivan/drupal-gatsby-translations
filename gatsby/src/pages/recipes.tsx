import * as React from "react"
import { PageProps, graphql } from "gatsby"

import { Layout } from "../components/layout"
import { useTranslation } from "react-i18next"
import { LocalizedLink, useLocalization } from "gatsby-theme-i18n"
import { RecipeListingQuery } from "../../graphql-types"

export const query = graphql`
  query RecipeListing($locale: String!) {
    allNodeRecipe(filter: { langcode: { eq: $locale } }) {
      edges {
        node {
          id
          langcode
          title
          path {
            alias
          }
        }
      }
    }
  }
`

const Recipes: React.FC<PageProps & { data: RecipeListingQuery }> = ({
  data,
  path,
}) => {
  const { t } = useTranslation()
  const { config } = useLocalization()
  return (
    <Layout>
      <h1>{t("Recipes")}</h1>
      {config.map(language => (
        <LocalizedLink to={path} language={language.code}>
          {language.code.toUpperCase()}
        </LocalizedLink>
      ))}
      <ul>
        {data.allNodeRecipe.edges.map(recipe => (
          <li>
            <LocalizedLink to={recipe.node.path.alias}>
              {recipe.node.title}
            </LocalizedLink>
          </li>
        ))}
      </ul>
    </Layout>
  )
}

export default Recipes
