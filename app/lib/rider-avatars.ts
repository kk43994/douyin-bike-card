export const RIDER_AVATARS = [
  "/riders/cn-bike-01.jpg",
  "/riders/cn-bike-02.jpg",
  "/riders/cn-bike-03.jpg",
  "/riders/cn-bike-04.jpg",
  "/riders/cn-bike-05.jpg",
  "/riders/cn-bike-06.jpg",
  "/riders/cn-bike-07.jpg",
  "/riders/cn-bike-08.jpg",
  "/riders/cn-bike-09.jpg",
  "/riders/cn-bike-10.jpg",
  "/riders/cn-bike-11.jpg",
  "/riders/cn-bike-12.jpg",
  "/riders/cn-bike-13.jpg",
  "/riders/cn-bike-14.jpg",
  "/riders/cn-bike-15.jpg",
  "/riders/cn-bike-16.jpg",
];

export function riderAvatarAt(index: number): string {
  return RIDER_AVATARS[index % RIDER_AVATARS.length];
}
