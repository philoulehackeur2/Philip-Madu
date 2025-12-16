import React from 'react';
import { BaseBoxShapeUtil, HTMLContainer } from 'tldraw';

export class FashionCardUtil extends BaseBoxShapeUtil<any> {
  static type = 'fashion-card' as const;

  getDefaultProps() {
    return {
      w: 240,
      h: 320,
      imgUrl: '',
      prompt: '',
      brand: 'DE_ROCHE',
    };
  }

  component(shape: any) {
    const isDeRoche = shape.props.brand === 'DE_ROCHE';
    
    return (
      <HTMLContainer style={{ pointerEvents: 'all' }}>
        <div 
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            border: isDeRoche ? '1px solid #A7A8AA' : '1px solid #C5A059',
            background: isDeRoche ? '#f4f4f4' : '#0a0a0a',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {shape.props.imgUrl ? (
             <img 
               src={shape.props.imgUrl} 
               alt="asset" 
               style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} 
               draggable={false}
             />
          ) : (
             <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-500 text-xs">NO IMAGE</div>
          )}
          
          <div style={{
             position: 'absolute',
             bottom: 0,
             left: 0,
             width: '100%',
             padding: '8px',
             background: 'rgba(0,0,0,0.7)',
             backdropFilter: 'blur(4px)',
             color: 'white',
             fontSize: '10px',
             fontFamily: 'monospace',
             whiteSpace: 'nowrap',
             overflow: 'hidden',
             textOverflow: 'ellipsis'
          }}>
             {shape.props.prompt}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: any) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

export class ComparisonUtil extends BaseBoxShapeUtil<any> {
    static type = 'comparison-card' as const;
  
    getDefaultProps() {
      return {
        w: 400,
        h: 500,
        imgLeft: '',
        imgRight: '',
      };
    }
  
    component(shape: any) {
      return (
        <HTMLContainer style={{ pointerEvents: 'all' }}>
           <div style={{ width: '100%', height: '100%', display: 'flex', border: '2px solid white', background: 'black', overflow: 'hidden' }}>
              <div style={{ flex: 1, borderRight: '1px solid white', position: 'relative' }}>
                  <img src={shape.props.imgLeft} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 5, left: 5, background: 'black', color: 'white', fontSize: '10px', padding: '2px 6px' }}>A</div>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                  <img src={shape.props.imgRight} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 5, left: 5, background: 'black', color: 'white', fontSize: '10px', padding: '2px 6px' }}>B</div>
              </div>
           </div>
        </HTMLContainer>
      );
    }
    
    indicator(shape: any) {
        return <rect width={shape.props.w} height={shape.props.h} />;
    }
}