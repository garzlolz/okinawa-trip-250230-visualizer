export const SkyFlower = {
  props: ['color', 'className'],
  template: `
<svg viewBox="0 0 200 200" >
            <g :fill="color">
              <ellipse
                cx="100"
                cy="40"
                rx="30"
                ry="50"
                transform="rotate(0 100 100)"
              />
              <ellipse
                cx="100"
                cy="40"
                rx="30"
                ry="50"
                transform="rotate(72 100 100)"
              />
              <ellipse
                cx="100"
                cy="40"
                rx="30"
                ry="50"
                transform="rotate(144 100 100)"
              />
              <ellipse
                cx="100"
                cy="40"
                rx="30"
                ry="50"
                transform="rotate(216 100 100)"
              />
              <ellipse
                cx="100"
                cy="40"
                rx="30"
                ry="50"
                transform="rotate(288 100 100)"
              />
            </g>
            <circle cx="100" cy="100" r="25" fill="#FFF" opacity="0.8" />
            <circle cx="100" cy="100" r="15" :fill="color" opacity="0.5" />
          </svg>
`
};

export const Jellyfish = {
  props: ['className'],
  template: `
<svg viewBox="0 0 100 120" >
            <path
              d="M10,40 Q50,-20 90,40"
              fill="#FF959D"
              stroke="#E87D85"
              stroke-width="3"
            />
            <path d="M10,40 L90,40" fill="#FF959D" />
            <path
              d="M20,40 Q20,80 10,100"
              stroke="#FF959D"
              stroke-width="4"
              fill="none"
            />
            <path
              d="M40,40 Q50,80 40,110"
              stroke="#FF959D"
              stroke-width="4"
              fill="none"
            />
            <path
              d="M60,40 Q50,80 60,110"
              stroke="#FF959D"
              stroke-width="4"
              fill="none"
            />
            <path
              d="M80,40 Q80,80 90,100"
              stroke="#FF959D"
              stroke-width="4"
              fill="none"
            />
            <circle cx="30" cy="25" r="3" fill="#E87D85" />
            <circle cx="60" cy="15" r="4" fill="#E87D85" />
            <circle cx="75" cy="30" r="2" fill="#E87D85" />
          </svg>
`
};

export const Pineapple = {
  props: ['className'],
  template: `
<svg viewBox="0 0 100 140" >
            <path d="M50,40 Q30,10 50,0 Q70,10 50,40" fill="#4CAF50" />
            <path d="M50,40 Q20,20 30,5 Q40,20 50,40" fill="#66BB6A" />
            <path d="M50,40 Q80,20 70,5 Q60,20 50,40" fill="#66BB6A" />
            <ellipse
              cx="50"
              cy="85"
              rx="35"
              ry="45"
              fill="#F7E35E"
              stroke="#E6D04A"
              stroke-width="2"
            />
            <line
              x1="30"
              y1="60"
              x2="70"
              y2="110"
              stroke="#E6D04A"
              stroke-width="1"
            />
            <line
              x1="70"
              y1="60"
              x2="30"
              y2="110"
              stroke="#E6D04A"
              stroke-width="1"
            />
            <line
              x1="25"
              y1="80"
              x2="75"
              y2="80"
              stroke="#E6D04A"
              stroke-width="1"
            />
            <line
              x1="25"
              y1="95"
              x2="75"
              y2="95"
              stroke="#E6D04A"
              stroke-width="1"
            />
          </svg>
`
};
