const result = [
  {
    "stories": [
      {
        "url": "https://cdn.sanity.io/files/vkbgitwu/production/cc649a3798488e9c7cbe7e2795806e21168b79c9.ogg"
      },
      {
        "url": "https://cdn.sanity.io/files/vkbgitwu/production/f14426830dc1fa4d5bc9a76faad192b0b627c339.ogg"
      },
      {
        "url": "https://cdn.sanity.io/files/vkbgitwu/production/e4772dbae14428ba91ae6043d5ea18c72a0c6e5e.ogg"
      },
      {
        "url": "https://cdn.sanity.io/files/vkbgitwu/production/99f5a94061d6626433c0405449451debbc5f6175.ogg"
      },
      {
        "url": "https://cdn.sanity.io/files/vkbgitwu/production/1d74499c09386016b7fbcbc9f5a1fb193526f911.ogg"
      },
      {
        "url": "https://cdn.sanity.io/files/vkbgitwu/production/94dfc68cd09bd33d94acdadee73a41dabfb624f6.ogg"
      },
      {
        "url": "https://cdn.sanity.io/files/vkbgitwu/production/35da728db2d463e2db377c5fd58229eff974ba66.ogg"
      }
    ]
  },
  {
    "stories": [
      {
        "url": "https://cdn.sanity.io/files/vkbgitwu/production/35da728db2d463e2db377c5fd58229eff974ba66.ogg"
      }
    ]
  }
]

urls = result.map(person => { return person.stories.map(story => { return story.url }) })

console.log(urls);