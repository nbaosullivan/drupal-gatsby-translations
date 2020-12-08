import * as React from "react"
import { graphql, PageProps } from "gatsby"
import { Layout } from "../components/layout"
import { useTranslation } from "react-i18next"
import { RecipeDetailsQuery } from "../../graphql-types"

export const query = graphql`
  query RecipeDetails($id: String!, $langcode: String!) {
    translations: allNodeRecipe(filter: { drupal_id: { eq: $id } }) {
      nodes {
        path {
          alias
        }
        langcode
      }
    }
    content: nodeRecipe(drupal_id: { eq: $id }, langcode: { eq: $langcode }) {
      title
      field_summary {
        value
      }
      field_recipe_instruction {
        processed
      }
    }
  }
`

const RecipeDetailsPage: React.FC<PageProps & { data: RecipeDetailsQuery }> = ({
  data,
}) => {
  const { t } = useTranslation()
  return (
    <Layout translations={data.translations}>
      <h1>{data.content.title}</h1>
      <p>{data.content.field_summary.value}</p>
      <h2>{t("Method")}</h2>
      <p
        dangerouslySetInnerHTML={{
          __html: data.content.field_recipe_instruction.processed,
        }}
      />
      {/*<h2>{t('Reviews')}</h2>*/}
    </Layout>
  )
}

export default RecipeDetailsPage
