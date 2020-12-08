"use strict"

const _ = require(`lodash`)

const axios = require(`axios`)

const { nodeFromData, downloadFile, isFileNode } = require(`./normalize`)

const backRefsNamesLookup = new WeakMap()
const referencedNodesLookup = new WeakMap()

const getHref = link => {
  if (typeof link === `object`) {
    return link.href
  }

  return link
}

const fetchLanguageConfig = async ({
  translation,
  baseUrl,
  apiBase,
  basicAuth,
  headers,
  params,
}) => {
  if (!translation) {
    return {
      defaultLanguage: `und`,
      enabledLanguages: [`und`],
      translatableEntities: [],
    }
  }

  let next = `${baseUrl}/${apiBase}/configurable_language/configurable_language?sort=weight`
  let availableLanguagesResponses = []
  let translatableEntitiesResponses = []

  while (next) {
    const response = await axios.get(next, {
      auth: basicAuth,
      headers,
      params,
    })
    availableLanguagesResponses = availableLanguagesResponses.concat(
      response.data.data
    )
    next = getHref(response.data.links.next)
  }

  next = `${baseUrl}/${apiBase}/language_content_settings/language_content_settings?filter[language_alterable]=true`

  while (next) {
    const response = await axios.get(next, {
      auth: basicAuth,
      headers,
      params,
    })
    translatableEntitiesResponses = translatableEntitiesResponses.concat(
      response.data.data
    )
    next = getHref(response.data.links.next)
  }

  const enabledLanguages = availableLanguagesResponses
    .filter(
      language =>
        [`und`, `zxx`].indexOf(language.attributes.drupal_internal__id) === -1
    )
    .map(language => language.attributes.drupal_internal__id)
  const defaultLanguage = enabledLanguages[0]
  const translatableEntities = translatableEntitiesResponses.map(entity => {
    return {
      type: entity.attributes.target_entity_type_id,
      bundle: entity.attributes.target_bundle,
      id: `${entity.attributes.target_entity_type_id}--${entity.attributes.target_bundle}`,
    }
  })
  return {
    defaultLanguage,
    enabledLanguages,
    translatableEntities,
  }
}

exports.fetchLanguageConfig = fetchLanguageConfig

const handleReferences = (
  node,
  languageConfig,
  attachUntranslatedReferencesOfTypes,
  { getNode, createNodeId }
) => {
  const relationships = node.relationships
  const rootNodeLanguage = node.langcode

  if (node.drupal_relationships) {
    const referencedNodes = []
    const attachRelationship = data => {
      let node, referencedNodeId
      const isTranslatableReferencedNodeType = languageConfig.translatableEntities.some(
        entity => entity.id === data.type
      )

      if (
        isTranslatableReferencedNodeType &&
        attachUntranslatedReferencesOfTypes.includes(data.type)
      ) {
        // Check the root node's language first, then the site's default language.
        const languagesToCheck = [
          rootNodeLanguage,
          languageConfig.defaultLanguage,
        ]
        // If these don't match, check the other languages.
        languageConfig.enabledLanguages.forEach(langcode => {
          if (!languagesToCheck.includes(langcode)) {
            languagesToCheck.push(langcode)
          }
        })
        for (const langcode of languagesToCheck) {
          referencedNodeId = createNodeId(`${langcode}${data.id}`)
          node = getNode(referencedNodeId)
          if (node) {
            break
          }
        }
      } else {
        const referenceLanguagePrefix = isTranslatableReferencedNodeType
          ? rootNodeLanguage
          : languageConfig.defaultLanguage
        referencedNodeId = createNodeId(`${referenceLanguagePrefix}${data.id}`)
        node = getNode(referencedNodeId)
      }

      if (!node) {
        return null
      }

      referencedNodes.push(referencedNodeId)
      return referencedNodeId
    }

    _.each(node.drupal_relationships, (v, k) => {
      if (!v.data) return
      const nodeFieldName = `${k}___NODE`

      if (_.isArray(v.data)) {
        relationships[nodeFieldName] = _.compact(
          v.data.map(data => attachRelationship(data))
        )

        const meta = _.compact(
          v.data.map(data => (!_.isEmpty(data.meta) ? data.meta : null))
        ) // If there's meta on the field and it's not an existing/internal one
        // create a new node's field with that meta. It can't exist on both
        // @see https://jsonapi.org/format/#document-resource-object-fields

        if (!_.isEmpty(meta) && !(k in node)) {
          node[k] = meta
        }
      } else {
        const id = attachRelationship(v.data)
        if (id) {
          relationships[nodeFieldName] = id
        }

        // If there's meta on the field and it's not an existing/internal one
        // create a new node's field with that meta. It can't exist on both
        // @see https://jsonapi.org/format/#document-resource-object-fields

        if (!_.isEmpty(v.data.meta) && !(k in node)) {
          node[k] = v.data.meta
        }
      }
    })

    delete node.drupal_relationships
    referencedNodesLookup.set(node, referencedNodes)

    if (referencedNodes.length) {
      const nodeFieldName = `${node.internal.type}___NODE`
      referencedNodes.forEach(nodeID => {
        const referencedNode = getNode(nodeID)

        if (!referencedNode.relationships[nodeFieldName]) {
          referencedNode.relationships[nodeFieldName] = []
        }

        if (!referencedNode.relationships[nodeFieldName].includes(node.id)) {
          referencedNode.relationships[nodeFieldName].push(node.id)
        }

        let backRefsNames = backRefsNamesLookup.get(referencedNode)

        if (!backRefsNames) {
          backRefsNames = []
          backRefsNamesLookup.set(referencedNode, backRefsNames)
        }

        if (!backRefsNames.includes(nodeFieldName)) {
          backRefsNames.push(nodeFieldName)
        }
      })
    }
  }

  node.relationships = relationships
}

exports.handleReferences = handleReferences

const handleWebhookUpdate = async (
  {
    nodeToUpdate,
    actions,
    cache,
    createNodeId,
    createContentDigest,
    getCache,
    getNode,
    reporter,
    store,
    languageConfig,
  },
  pluginOptions = {}
) => {
  const { createNode } = actions
  const newNode = nodeFromData(nodeToUpdate, createNodeId)
  const nodesToUpdate = [newNode]
  const { attachUntranslatedReferencesOfTypes = [] } = pluginOptions
  handleReferences(
    newNode,
    languageConfig,
    attachUntranslatedReferencesOfTypes,
    {
      getNode,
      createNodeId,
    }
  )
  const oldNode = getNode(newNode.id)

  if (oldNode) {
    // copy over back references from old node
    const backRefsNames = backRefsNamesLookup.get(oldNode)

    if (backRefsNames) {
      backRefsNamesLookup.set(newNode, backRefsNames)
      backRefsNames.forEach(backRefFieldName => {
        newNode.relationships[backRefFieldName] =
          oldNode.relationships[backRefFieldName]
      })
    }

    const oldNodeReferencedNodes = referencedNodesLookup.get(oldNode)
    const newNodeReferencedNodes = referencedNodesLookup.get(newNode) // see what nodes are no longer referenced and remove backRefs from them

    const removedReferencedNodes = _.difference(
      oldNodeReferencedNodes,
      newNodeReferencedNodes
    ).map(id => getNode(id))

    nodesToUpdate.push(...removedReferencedNodes)
    const nodeFieldName = `${newNode.internal.type}___NODE`
    removedReferencedNodes.forEach(referencedNode => {
      referencedNode.relationships[
        nodeFieldName
      ] = referencedNode.relationships[nodeFieldName].filter(
        id => id !== newNode.id
      )
    }) // see what nodes are newly referenced, and make sure to call `createNode` on them

    const addedReferencedNodes = _.difference(
      newNodeReferencedNodes,
      oldNodeReferencedNodes
    ).map(id => getNode(id))

    nodesToUpdate.push(...addedReferencedNodes)
  } else {
    // if we are inserting new node, we need to update all referenced nodes
    const newNodes = referencedNodesLookup.get(newNode)

    if (typeof newNodes !== `undefined`) {
      newNodes.forEach(id => nodesToUpdate.push(getNode(id)))
    }
  } // download file

  const { skipFileDownloads } = pluginOptions

  if (isFileNode(newNode) && !skipFileDownloads) {
    await downloadFile(
      {
        node: newNode,
        store,
        cache,
        createNode,
        createNodeId,
        getCache,
      },
      pluginOptions
    )
  }

  for (const node of nodesToUpdate) {
    if (node.internal.owner) {
      delete node.internal.owner
    }

    node.internal.contentDigest = createContentDigest(node)
    createNode(node)
    reporter.log(`Updated node: ${node.id}`)
  }
}

exports.handleWebhookUpdate = handleWebhookUpdate
