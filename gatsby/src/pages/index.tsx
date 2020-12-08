import * as React from "react"

import { Layout } from "../components/layout"
import Image from "../components/image"
import { useTranslation } from "react-i18next"
import { LocalizedLink } from "gatsby-theme-i18n"

const IndexPage = () => {
  const { t } = useTranslation()
  return (
    <Layout>
      <h1>{t("Home")}</h1>
      <div style={{ maxWidth: `300px`, marginBottom: `1.45rem` }}>
        <Image />
      </div>
      <LocalizedLink to={"/recipes"}>{t("Recipes")}</LocalizedLink>
    </Layout>
  )
}

export default IndexPage
