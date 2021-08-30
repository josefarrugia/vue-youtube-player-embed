<template>
  <div class="wrapper" :style="style">
    <div v-if="videoId" :id="`player_${videoId}`" ref="player" />
    <div v-else class="errors">
      <div class="">
        Please provide correct YouTube video id
      </div>
    </div>
  </div>
</template>

<script>
/**
 * Created by José Farrugia
 * August 2021
 *
 */
export default {
  props: {
    videoId: {
      type: String,
      default: '',
    },
    ratio: {
      type: String,
      default: '16:9',
    },
  },

  data() {
    return {
      // YouTube Player API
      youtubePlayer: null,
      youtubePlayerScriptSrc: 'https://www.youtube.com/iframe_api',
      youTubePlayerState: -1, // unstarted data value for video
      youTubePlayerReady: false,
      states: [],

      // IntersectionObserver
      observer: null,
      observerOptions: {
        root: null,
        threshold: 0,
      },
    }
  },

  computed: {
    //  Returns the respective calculated padding bottom value
    calculateRatio() {
      switch (this.ratio) {
        case '16:9':
          return { 'padding-bottom': '56.25%' }

        case '1:1':
          return { 'padding-bottom': '100%' }

        default:
          return {}
      }
    },

    // Custom css style binding
    style() {
      return {
        ...this.calculateRatio,
      }
    },
  },

  watch: {
    youTubePlayerReady: {
      immediate: true,
      handler(value) {
        if (value) this.initObserver()
      },
    },
  },

  mounted() {
    if (!this.videoId) {
      console.error('Please provide correct YouTube video id')
      return // exit
    }

    this.initPlayer()
  },

  beforeDestroy() {
    if (this.youtubePlayer !== null && this.youtubePlayer.destroy)
      this.youtubePlayer.destroy()
  },

  methods: {
    /**
     * This method will create the <script> tag in the <head>
     * and will load the IFrame Player API code asynchronously
     */
    setupPlayerScript() {
      console.log(this.videoId, 'setupPlayerScript()')
      const tag = document.createElement('script')

      tag.src = this.youtubePlayerScriptSrc

      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    },

    checkYouTubeIframeAPIReady() {
      return (
        window.onYouTubeIframeAPIReady instanceof Function &&
        window.YT instanceof Object &&
        window.YT.Player instanceof Object
      )
    },

    isIFrameAPIReady() {
      const ready = new Promise((resolve) => {
        if (
          window.YT &&
          window.YT.Player &&
          window.YT.Player instanceof Function
        ) {
          resolve(window.YT)

          return
        } else {
          this.setupPlayerScript()
        }

        const previous = window.onYouTubeIframeAPIReady

        // The API will call this function when page has finished downloading
        // the JavaScript for the player API.
        window.onYouTubeIframeAPIReady = () => {
          if (previous) {
            previous()
          }

          resolve(window.YT)
        }
      })
      console.log(ready)
      return ready
    },

    /**
     * This method creates an <iframe> (and YouTube player)
     * after the API code downloads
     */
    initPlayer() {
      console.log(this.videoId, 'initPlayer()')

      // const youtubeIframeAPI = this.isIFrameAPIReady()

      // youtubeIframeAPI.then((YT) => {
      //   this.newPlayer(YT)
      // })

      // old code

      /**
       * Checks whether the YouTubeIframeAPIReady has been loaded in
       * This can be the case when moving between different pages and routes
       * If so, call newPlayer()
       */
      if (this.checkYouTubeIframeAPIReady()) {
        console.warn('already exists')
        this.newPlayer(window.YT)
        return
      }

      const previous = window.onYouTubeIframeAPIReady

      this.setupPlayerScript()

      window.onYouTubeIframeAPIReady = () => {
        if (previous) {
          previous()
        }
        this.states = window.YT.PlayerState
        this.newPlayer(window.YT)
      }
    },

    /**
     * Creates new IFrame player
     */
    newPlayer(YT) {
      console.warn(this.videoId, 'newPlayer()')
      this.youtubePlayer = new YT.Player(`player_${this.videoId}`, {
        videoId: this.videoId,
        playerVars: {
          playsinline: 1,
          modestbranding: 1, // less branding
          rel: 0, // related videos
          loop: 1, // loop video,
          mute: 1, // mute the video by default
          fs: 0, // fullscreen
          controls: 0, // controls
          disablekb: 1, // disable keyboard shortcuts
          enablejsapi: 1, // enable iFrame API
          origin: '', // domain url,
        },
        events: {
          onReady: this.onPlayerReady,
          onStateChange: this.onPlayerStateChange,
          onError: this.onPlayerError,
        },
      })
    },

    async playVideo() {
      await this.youtubePlayer.playVideo()
    },

    onPlayerReady(event) {
      const videoData = event.target.getVideoData()

      this.$emit('player-ready', {
        target: event.target,
        id: videoData.video_id,
        title: videoData.title,
      })

      this.youTubePlayerReady = true
    },

    onPlayerStateChange({ data }) {
      this.youTubePlayerState = data
      this.$emit(
        'player-state-change',
        Object.keys(this.states).find((key) => this.states[key] === data)
      )
    },

    onPlayerError(event) {
      this.$emit('player-error', event.target)
    },

    /**
     * This method will handle the intersection entry and check
     * if it is intersecting
     */
    handleIntersect([entry]) {
      const { isIntersecting } = entry

      if (isIntersecting) {
        this.playVideo()
        this.observer.unobserve(this.$el)
      }
    },

    /**
     * This method will create the intersection observer
     * Options can be found in data() observerOptions
     */
    createObserver() {
      this.observer = new IntersectionObserver(
        this.handleIntersect,
        this.observerOptions
      )
    },

    initObserver() {
      // if browser supports intersectionObserver
      if (window.IntersectionObserver) {
        this.createObserver()
        this.observer.observe(this.$el)
      } else {
        this.playVideo()
      }
    },
  },
}
</script>

<style lang="postcss" scoped>
.wrapper {
  position: relative;
  height: 0;

  /* deep css scoped styles for iframe and errors element which is created dynamically by script */
  & >>> iframe,
  & >>> .errors {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
