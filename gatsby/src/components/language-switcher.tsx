import * as React from "react"
import { LocalizedLink } from "gatsby-theme-i18n"
export const LanguageSwitcher: React.FC<{ translations: any }> = ({
  translations,
}) => (
  <div>
    {translations &&
      translations.nodes.map((translation, index) => (
        <React.Fragment key={index}>
          <LocalizedLink
            to={translation.path.alias}
            language={translation.langcode}
            style={{
              color: `white`,
              textDecoration: `none`,
            }}
          >
            {translation.langcode.toUpperCase()}
          </LocalizedLink>
          {index !== translations.nodes.length - 1 && (
            <span style={{ color: "rgba(255,255,255,0.3)" }}> | </span>
          )}
        </React.Fragment>
      ))}
  </div>
)
