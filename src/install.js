import YouTubePlayerEmbed from './components/YouTubePlayerEmbed'

const YouTubePlayerEmbedInstall = {
  install(Vue) {
    Vue.component('you-tube-player-embed', YouTubePlayerEmbed)
  }
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(YouTubePlayerEmbedInstall)
}

export default YouTubePlayerEmbedInstall
