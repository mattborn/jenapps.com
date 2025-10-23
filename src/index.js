let eventsData = []
const watchedVideos = JSON.parse(localStorage.getItem('jenapps') || '[]')

const toggleWatched = (video, card) => {
  const index = watchedVideos.indexOf(video)
  if (index > -1) {
    watchedVideos.splice(index, 1)
    card.classList.remove('watched')
  } else {
    watchedVideos.push(video)
    card.classList.add('watched')
  }
  localStorage.setItem('jenapps', JSON.stringify(watchedVideos))
}

const formatDate = dateStr => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${date.toLocaleDateString('en-US', { month: 'short' })} ${day}`
}

const createTitle = (titles, link) => {
  const title = document.createElement('div')
  title.className = 'title'
  const titleParts = titles.split(';')
  if (link) {
    const anchor = document.createElement('a')
    anchor.href = link
    anchor.target = '_blank'
    anchor.textContent = titleParts[0]
    title.appendChild(anchor)
  } else {
    title.textContent = titleParts[0]
  }
  if (titleParts[1]) {
    const aka = document.createElement('span')
    aka.className = 'aka'
    aka.textContent = ` ${titleParts[1]}`
    title.appendChild(aka)
  }
  return title
}

const createYearHeader = year => {
  const yearHeader = document.createElement('div')
  yearHeader.className = 'year-header'
  const yearText = document.createElement('div')
  yearText.className = 'year-text'
  yearText.textContent = year
  yearHeader.appendChild(yearText)
  return yearHeader
}

const getVideoId = videoUrl => {
  if (!videoUrl) return null
  if (videoUrl.includes('youtu.be')) return videoUrl.split('youtu.be/')[1]?.split('?')[0]
  if (videoUrl.includes('/live/')) return videoUrl.split('/live/')[1]?.split('?')[0]
  return new URLSearchParams(videoUrl.split('?')[1]).get('v')
}

fetch('data/events.csv')
  .then(res => res.text())
  .then(csv => {
    const events = document.getElementById('events')
    const filterNav = document.getElementById('filter-nav')
    const categories = new Set()
    let currentYear = null
    eventsData = csv.trim().split('\n').slice(1).map(row => {
      const [date, category, company, titles, links, video] = row.split(',')
      return { category, company, date, links, titles, video }
    })
    const yearHeader = createYearHeader(new Date(eventsData[0].date).getFullYear())
    const segmentedControl = document.createElement('div')
    segmentedControl.className = 'segmented-control'
    const linksSegment = document.createElement('div')
    linksSegment.className = 'segment active'
    linksSegment.dataset.mode = 'list'
    const linksIcon = document.createElement('i')
    linksIcon.className = 'fa-solid fa-list'
    linksSegment.appendChild(linksIcon)
    linksSegment.appendChild(document.createTextNode(' Links'))
    const videosSegment = document.createElement('div')
    videosSegment.className = 'segment'
    videosSegment.dataset.mode = 'video'
    const videosIcon = document.createElement('i')
    videosIcon.className = 'fa-solid fa-video'
    videosSegment.appendChild(videosIcon)
    videosSegment.appendChild(document.createTextNode(' Videos'))
    segmentedControl.appendChild(linksSegment)
    segmentedControl.appendChild(videosSegment)
    yearHeader.appendChild(segmentedControl)
    events.appendChild(yearHeader)
    const listView = document.createElement('div')
    listView.id = 'list-view'
    const videoView = document.createElement('div')
    videoView.id = 'video-view'
    videoView.className = 'video-grid'
    videoView.style.display = 'none'
    events.appendChild(listView)
    events.appendChild(videoView)
    eventsData.forEach(({ category, company, date, links, titles, video }) => {
      categories.add(category)
      const year = new Date(date).getFullYear()
      if (year !== currentYear) {
        currentYear = year
        if (listView.children.length) listView.appendChild(createYearHeader(year))
      }
      const linkArray = links?.split(';') || []
      const eventRow = document.createElement('div')
      eventRow.className = 'event-row'
      eventRow.dataset.category = category
      const dateDiv = document.createElement('div')
      dateDiv.className = 'date'
      dateDiv.textContent = formatDate(date)
      const title = createTitle(titles, linkArray[0])
      const companySpan = document.createElement('span')
      companySpan.className = 'company'
      companySpan.textContent = company
      title.appendChild(companySpan)
      eventRow.appendChild(dateDiv)
      eventRow.appendChild(title)
      if (linkArray.length > 1) {
        const pressLink = document.createElement('a')
        pressLink.className = 'press'
        pressLink.href = linkArray[1]
        pressLink.target = '_blank'
        pressLink.textContent = 'Press release'
        eventRow.appendChild(pressLink)
      }
      listView.appendChild(eventRow)
    })
    const allLink = document.createElement('a')
    allLink.className = 'active'
    allLink.href = '#all'
    allLink.textContent = 'All'
    filterNav.appendChild(allLink)
    Array.from(categories).sort().forEach(cat => {
      const catLink = document.createElement('a')
      catLink.href = `#${cat.toLowerCase()}`
      catLink.textContent = cat
      filterNav.appendChild(catLink)
    })
    // ScrollReveal().reveal('#filter-nav a, .year-header, .event-row', scrollConfig)
  })

document.addEventListener('click', e => {
  const filterLink = e.target.closest('#filter-nav a')
  if (filterLink) {
    e.preventDefault()
    document.querySelectorAll('#filter-nav a').forEach(a => a.classList.remove('active'))
    filterLink.classList.add('active')
    const filter = filterLink.href.split('#')[1]
    document.querySelectorAll('.event-row, .video-card').forEach(el => {
      const show = filter === 'all' || el.dataset.category.toLowerCase() === filter
      el.style.display = show ? '' : 'none'
      // if (show) el.style.opacity = 1
    })
    document.querySelectorAll('#list-view .year-header').forEach(header => {
      const nextSibling = header.nextElementSibling
      let hasVisibleEvents = false
      let sibling = nextSibling
      while (sibling && !sibling.classList.contains('year-header')) {
        if (sibling.classList.contains('event-row') && sibling.style.display !== 'none') {
          hasVisibleEvents = true
          break
        }
        sibling = sibling.nextElementSibling
      }
      header.style.display = hasVisibleEvents ? '' : 'none'
      // if (hasVisibleEvents) header.style.opacity = 1
    })
    return
  }
  const segment = e.target.closest('.segment')
  if (segment) {
    const mode = segment.dataset.mode
    document.querySelectorAll('.segment').forEach(s => s.classList.toggle('active', s.dataset.mode === mode))
    document.getElementById('list-view').style.display = mode === 'list' ? '' : 'none'
    const videoView = document.getElementById('video-view')
    videoView.style.display = mode === 'video' ? 'flex' : 'none'
    if (mode === 'video' && !videoView.children.length) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const iframe = entry.target.querySelector('iframe')
          if (!iframe) return
          if (entry.isIntersecting) {
            if (iframe.dataset.src) iframe.src = iframe.dataset.src
          } else {
            if (iframe.src) {
              iframe.dataset.src = iframe.src
              iframe.removeAttribute('src')
            }
          }
        })
      }, { rootMargin: '50%' })
      eventsData.forEach(({ category, date, titles, video }) => {
        const videoId = getVideoId(video)
        if (videoId) {
          const videoCard = document.createElement('div')
          videoCard.className = 'video-card'
          videoCard.dataset.category = category
          if (watchedVideos.includes(video)) videoCard.classList.add('watched')
          const videoMeta = document.createElement('div')
          videoMeta.className = 'video-meta'
          const dateDiv = document.createElement('div')
          dateDiv.className = 'date'
          dateDiv.textContent = formatDate(date)
          const title = createTitle(titles)
          const watchIcon = document.createElement('i')
          watchIcon.className = watchedVideos.includes(video) ? 'fa-solid fa-circle-check watch-icon' : 'fa-solid fa-eye watch-icon'
          watchIcon.title = 'Mark as watched'
          watchIcon.style.cursor = 'pointer'
          watchIcon.onclick = () => {
            toggleWatched(video, videoCard)
            watchIcon.className = watchedVideos.includes(video) ? 'fa-solid fa-circle-check watch-icon' : 'fa-solid fa-eye watch-icon'
          }
          videoMeta.appendChild(dateDiv)
          videoMeta.appendChild(title)
          videoMeta.appendChild(watchIcon)
          videoCard.appendChild(videoMeta)
          const iframe = document.createElement('iframe')
          iframe.dataset.src = `https://www.youtube.com/embed/${videoId}`
          iframe.frameBorder = '0'
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          iframe.allowFullscreen = true
          videoCard.appendChild(iframe)
          videoView.appendChild(videoCard)
          observer.observe(videoCard)
        }
      })
    }
  }
})
