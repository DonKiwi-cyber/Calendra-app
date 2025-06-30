export const DAYS_OF_WEEK_IN_ORDER = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
] as const

  export const PrivateNavLinks = [
    {
      imgURL: '/assets/events.svg',
      route: '/events',
      label: 'Mis eventos',
    },
    {
      imgURL: '/assets/schedule.svg',
      route: '/schedule',
      label: 'Mi Agenda',
    },
    {
      imgURL: '/assets/public.svg',
      route: '/book',
      label: 'Perfil público',
    },
  ] as const