/**
 * src/ui/components/SegmentedControl.ts
 * Reusable Tactile Segmented Pill Control for PixiJS v8.
 * Used for Style Switcher (Classic vs Real 3D), Difficulty (Easy/Normal/Hard),
 * and Leaderboard/Stats Tab switching.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';
import { soundManager } from '../../audio/SoundAndHaptics';

export interface SegmentItem {
  id: string;
  label: string;
  icon?: string;
}

export interface SegmentedControlOptions {
  width: number;
  height?: number;
  items: SegmentItem[];
  initialSelectedId?: string;
  activeColor?: number;
  onChange?: (selectedId: string) => void;
}

export class SegmentedControl extends Container {
  private bgGraphics: Graphics;
  private sliderGraphics: Graphics;
  private itemContainers: Container[] = [];

  private totalWidth: number;
  private totalHeight: number;
  private items: SegmentItem[];
  private selectedId: string;
  private activeColor: number;
  private onChangeCallback?: (id: string) => void;

  constructor(options: SegmentedControlOptions) {
    super();

    this.totalWidth = options.width;
    this.totalHeight = options.height ?? 28;
    this.items = options.items;
    this.selectedId = options.initialSelectedId ?? (options.items[0]?.id || '');
    this.activeColor = options.activeColor ?? DESIGN_TOKENS.colors.premiumGold;
    this.onChangeCallback = options.onChange;

    this.bgGraphics = new Graphics();
    this.addChild(this.bgGraphics);

    this.sliderGraphics = new Graphics();
    this.addChild(this.sliderGraphics);

    this.buildItems();
    this.draw();
  }

  public setSelectedId(id: string): void {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.draw();
  }

  public getSelectedId(): string {
    return this.selectedId;
  }

  private buildItems(): void {
    for (const c of this.itemContainers) {
      this.removeChild(c);
      c.destroy({ children: true });
    }
    this.itemContainers = [];

    const count = this.items.length;
    const itemW = (this.totalWidth - 4) / count;
    const h = this.totalHeight;

    this.items.forEach((item, index) => {
      const cont = new Container();
      const posX = -this.totalWidth / 2 + 2 + index * itemW + itemW / 2;
      cont.x = posX;
      cont.y = 0;

      // Transparent hit area
      const hit = new Graphics()
        .roundRect(-itemW / 2, -h / 2, itemW, h, DESIGN_TOKENS.radii.pill)
        .fill({ color: 0x000000, alpha: 0.001 });
      cont.addChild(hit);

      const isSel = item.id === this.selectedId;
      const labelText = item.icon ? `${item.icon} ${item.label}` : item.label;

      const style = new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: Math.min(12, Math.max(9.5, h * 0.42)),
        fill: isSel ? DESIGN_TOKENS.colors.navyOutline : DESIGN_TOKENS.colors.textSecondary,
        fontWeight: isSel ? 'bold' : '600',
        align: 'center',
      });

      const txt = new Text({ text: labelText, style });
      txt.anchor.set(0.5, 0.5);
      cont.addChild(txt);

      cont.eventMode = 'static';
      cont.cursor = 'pointer';
      cont.on('pointerdown', (e) => {
        e.stopPropagation();
        if (this.selectedId === item.id) return;
        soundManager.play('ui_click');
        this.selectedId = item.id;
        this.draw();
        if (this.onChangeCallback) this.onChangeCallback(this.selectedId);
      });

      this.itemContainers.push(cont);
      this.addChild(cont);
    });
  }

  private draw(): void {
    const w = this.totalWidth;
    const h = this.totalHeight;
    const r = DESIGN_TOKENS.radii.pill;
    const count = this.items.length;
    const itemW = (w - 4) / count;

    // Track capsule background
    this.bgGraphics.clear();
    this.bgGraphics
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.creamSecondary })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.normal });

    // Active pill slider
    const selIndex = Math.max(0, this.items.findIndex((it) => it.id === this.selectedId));
    const sliderX = -w / 2 + 2 + selIndex * itemW;
    const sliderW = itemW;
    const sliderH = h - 4;

    this.sliderGraphics.clear();
    this.sliderGraphics
      .roundRect(sliderX, -sliderH / 2, sliderW, sliderH, r)
      .fill({ color: this.activeColor })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: 1.8 });

    // Inner subtle highlight on active slider
    this.sliderGraphics
      .roundRect(sliderX + 2, -sliderH / 2 + 1, sliderW - 4, sliderH * 0.45, r)
      .fill({ color: 0xFFFFFF, alpha: 0.24 });

    // Update text formatting
    this.items.forEach((item, index) => {
      const isSel = item.id === this.selectedId;
      const cont = this.itemContainers[index];
      if (cont) {
        const txt = cont.children[1] as Text;
        if (txt) {
          txt.style.fill = isSel ? DESIGN_TOKENS.colors.navyOutline : DESIGN_TOKENS.colors.textSecondary;
          txt.style.fontWeight = isSel ? 'bold' : '600';
        }
      }
    });
  }
}
