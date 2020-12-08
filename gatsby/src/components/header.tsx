import * as React from "react"
import { LocalizedLink } from "gatsby-theme-i18n"
import { LanguageSwitcher } from "./language-switcher"
import { useTranslation } from "react-i18next"

const Header = ({ translations }) => {
  const { t } = useTranslation()
  return (
    <header
      style={{
        background: `rebeccapurple`,
        marginBottom: `1.45rem`,
      }}
    >
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `1.45rem 1.0875rem`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>
          <LocalizedLink
            to="/"
            style={{
              color: `white`,
              textDecoration: `none`,
            }}
          >
            {t("Decoupled Translations")}
          </LocalizedLink>
        </h1>
        <LanguageSwitcher translations={translations} />
      </div>
    </header>
  )
}

export default Header
