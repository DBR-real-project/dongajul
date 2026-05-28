import React, { useState } from 'react'

// 이미지 로딩 실패 시 보여줄 기본 엑박(대체) 아이콘의 Base64 인코딩된 SVG 주소
const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // 이미지 로딩 에러 발생 여부를 관리하는 상태 (false: 정상, true: 에러 발생)
  const [didError, setDidError] = useState(false)

  // 이미지 로딩 중 에러가 발생했을 때 호출되어 didError 상태를 true로 변경하는 함수
  const handleError = () => {
    setDidError(true)
  }

  // 전달받은 props 중에서 래핑용 div와 공통으로 사용할 속성(src, alt, style, className)을 구조 분해 할당으로 추출
  const { src, alt, style, className, ...rest } = props

  // didError 상태에 따른 조건부 렌더링
  return didError ? (
    // 1. 이미지 로딩에 실패한 경우 (대체 컨테이너 및 SVG 아이콘 출력)
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        {/* 에러 아이콘을 보여주며, 디버깅을 위해 data-original-url 속성에 원래 불러오려던 이미지 주소를 보존 */}
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    // 2. 이미지 로딩이 정상적인 경우 (일반 img 태그 출력 및 에러 이벤트 감지)
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}