interface PhotoGridProps {
  photos: string[];
  alt?: string;
}

const PhotoGrid = ({ photos, alt = "" }: PhotoGridProps) => {
  const count = photos.length;
  if (count === 0) return null;

  // 最多展示9张，超出部分显示 +N
  const visible = photos.slice(0, 9);
  const overflow = count - 9;

  const getGridClass = () => {
    switch (visible.length) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-2";
      case 3: return "grid-cols-3";
      case 4: return "grid-cols-2";
      default: return "grid-cols-3";
    }
  };

  const getImageClass = (idx: number) => {
    if (count === 1) return "aspect-[16/10] col-span-1";
    if (count === 2) return "aspect-square";
    if (count === 3) {
      if (idx === 0) return "aspect-[4/3] col-span-3 row-span-1";
      return "aspect-square col-span-1";
    }
    return "aspect-square";
  };

  // For 3 photos: first row full width, second row 2 cols
  const getWrapperGrid = () => {
    if (count === 3) return "grid gap-1.5";
    return `grid ${getGridClass()} gap-1.5`;
  };

  if (count === 3) {
    return (
      <div className="mt-2.5 grid gap-1.5">
        <img
          src={photos[0]}
          alt={alt}
          className="w-full aspect-[16/10] object-cover rounded-xl"
          loading="lazy"
        />
        <div className="grid grid-cols-2 gap-1.5">
          {photos.slice(1).map((p, i) => (
            <img key={i} src={p} alt={alt} className="w-full aspect-square object-cover rounded-xl" loading="lazy" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-2.5 grid ${getGridClass()} gap-1.5`}>
      {visible.map((photo, i) => {
        const isLast = i === visible.length - 1 && overflow > 0;
        return (
          <div key={i} className={`relative overflow-hidden rounded-xl ${getImageClass(i)}`}>
            <img
              src={photo}
              alt={alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {isLast && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-lg font-bold">+{overflow}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PhotoGrid;
