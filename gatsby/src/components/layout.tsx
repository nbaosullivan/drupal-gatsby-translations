/**
 * Layout component
 */

import * as React from "react"

import Header from "./header"
import "./layout.css"
import { useTranslation } from "react-i18next"

export const Layout: React.FC<{
  children?: JSX.Element | JSX.Element[]
  translations?: any
}> = ({ children, translations }) => {
  const { t } = useTranslation()
  return (
    <>
      <Header translations={translations} />
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
        }}
      >
        <main>{children}</main>
        <footer
          style={{
            marginTop: `2rem`,
          }}
        >
          © {new Date().getFullYear()}, {t("Built with")}
          {` `}
          <a href="https://www.gatsbyjs.com">Gatsby</a>
          {` `}& <a href="https://drupal.org">Drupal</a>
        </footer>
      </div>
    </>
  )
}
